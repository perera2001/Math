const mongoose = require('mongoose');
const QuizSession = require('../models/QuizSession');
const UserStats = require('../models/UserStats');
const { explainAnswer: explainAnswerWithAI } = require('./aiExplanationService');

// Read-only reference to the shared 'questions' collection
const QuestionSchema = new mongoose.Schema(
  {
    lesson: String,
    difficulty: String,
    questionText: {
      en: String,
      si: String,
      ta: String,
    },
    answers: [{ text: { en: String, si: String, ta: String }, isCorrect: Boolean }],
    grade: Number,
  },
  { collection: 'questions' }
);
// Avoid OverwriteModelError on hot-reload
const Question =
  mongoose.models.QuizQuestion || mongoose.model('QuizQuestion', QuestionSchema);

const BASE_POINTS = { Easy: 10, Medium: 20, Hard: 30 };
const TIME_MULTIPLIER = { '8min': 2.0, '16min': 1.0, unlimited: 0.5 };
const TIME_LIMITS = { '8min': 480, '16min': 960, unlimited: null };

const _buildPerQuestionReview = (questions = []) =>
  questions.map((q, i) => {
    const correctAnswerIndex = q.answers.findIndex((a) => a.isCorrect);
    return {
      questionIndex: i,
      questionText: q.questionText,
      options: q.answers.map((a) => a.text),
      isCorrect: q.isCorrect,
      userAnswerIndex: q.userAnswerIndex,
      correctAnswerIndex,
      timeSpent: q.timeSpent,
    };
  });

// ── startQuiz ────────────────────────────────────────────────────────────────
const startQuiz = async ({ grade, lesson, difficulty, timeMode, language = 'en', userId }) => {
  // Use $sample to pick 8 random questions directly from the shared collection
  const selected = await Question.aggregate([
    { $match: { lesson, difficulty, grade: Number(grade) } },
    { $sample: { size: 8 } },
  ]);

  if (!selected || selected.length < 8) {
    const err = new Error('Not enough questions');
    err.statusCode = 400;
    throw err;
  }

  const questionsSnapshot = selected.map((q) => ({
    questionId: q._id,
    questionText: q.questionText,
    answers: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
  }));

  const timeLimit = TIME_LIMITS[timeMode];

  const session = await QuizSession.create({
    userId,
    grade,
    language,
    lesson,
    difficulty,
    timeMode,
    timeLimit,
    questions: questionsSnapshot,
    startedAt: new Date(),
  });

  return {
    sessionId: session._id,
    questions: session.questions.map((q) => ({
      id: q._id,
      text: q.questionText,
      answers: q.answers.map((a) => ({ text: a.text })),
    })),
  };
};

// ── answerQuestion ───────────────────────────────────────────────────────────
const answerQuestion = async ({ sessionId, questionIndex, answerIndex, timeSpent, userId }) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }
  if (session.status !== 'in_progress') {
    const err = new Error('Session is not in progress');
    err.statusCode = 400;
    throw err;
  }

  const question = session.questions[questionIndex];
  if (!question) {
    const err = new Error('Question index out of range');
    err.statusCode = 400;
    throw err;
  }

  const isCorrect = question.answers[answerIndex]?.isCorrect === true;
  const correctAnswerIndex = question.answers.findIndex((a) => a.isCorrect);

  question.userAnswerIndex = answerIndex;
  question.isCorrect = isCorrect;
  question.timeSpent = timeSpent || 0;

  if (isCorrect) {
    session.currentStreak += 1;
    if (session.currentStreak > session.maxStreak) {
      session.maxStreak = session.currentStreak;
    }

    const base = BASE_POINTS[session.difficulty];
    const multiplier = TIME_MULTIPLIER[session.timeMode];

    let streakBonus = 0;
    if (session.currentStreak === 3) streakBonus = 10;
    else if (session.currentStreak === 5) streakBonus = 25;

    session.totalScore += Math.floor((base + streakBonus) * multiplier);
  } else {
    session.currentStreak = 0;
  }

  session.currentQuestionIndex = questionIndex + 1;
  await session.save();

  return {
    isCorrect,
    correctAnswerIndex,
    currentScore: session.totalScore,
    currentStreak: session.currentStreak,
  };
};

// ── useLifeline ──────────────────────────────────────────────────────────────
const useLifeline = async ({ sessionId, type, userId }) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }
  if (session.status !== 'in_progress') {
    const err = new Error('Session is not in progress');
    err.statusCode = 400;
    throw err;
  }
  if (session.lifelinesUsed[type]) {
    const err = new Error(`Lifeline '${type}' already used`);
    err.statusCode = 400;
    throw err;
  }
  if (type === 'extraTime' && session.timeMode === 'unlimited') {
    const err = new Error('Extra time is not available in unlimited mode');
    err.statusCode = 400;
    throw err;
  }

  session.lifelinesUsed[type] = true;

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const result = {};

  if (type === 'fiftyFifty') {
    const wrongIndices = currentQuestion.answers
      .map((a, i) => ({ i, isCorrect: a.isCorrect }))
      .filter((a) => !a.isCorrect)
      .map((a) => a.i)
      .sort(() => Math.random() - 0.5);

    result.hideIndices = wrongIndices.slice(0, Math.min(2, wrongIndices.length));
  } else if (type === 'skip') {
    currentQuestion.userAnswerIndex = null;
    currentQuestion.isCorrect = false;
    session.currentStreak = 0;
    session.currentQuestionIndex += 1;
    result.skipped = true;
    result.newQuestionIndex = session.currentQuestionIndex;
  } else if (type === 'extraTime') {
    // Client handles the +30s display; server only records use
    result.extraTime = 30;
  }

  await session.save();
  return result;
};

// ── completeQuiz ─────────────────────────────────────────────────────────────
const completeQuiz = async ({ sessionId, timeSpentTotal, userId }) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }
  if (session.status !== 'in_progress') {
    const err = new Error('Session already completed');
    err.statusCode = 400;
    throw err;
  }

  const correctCount = session.questions.filter((q) => q.isCorrect).length;

  // Perfect quiz bonus (8/8) applied at completion
  if (correctCount === 8) {
    session.totalScore += Math.floor(100 * TIME_MULTIPLIER[session.timeMode]);
  }

  // Lifeline penalty: −5 per lifeline used
  const lifelinesUsedCount = Object.values(session.lifelinesUsed).filter(Boolean).length;
  session.totalScore = Math.max(0, session.totalScore - lifelinesUsedCount * 5);

  const stars = _calculateStars(session, timeSpentTotal, correctCount);
  session.starsEarned = stars;
  session.correctCount = correctCount;
  session.timeSpentTotal = timeSpentTotal || 0;
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();

  // Atomically increment UserStats
  const incFields = {
    totalStars: stars,
    totalQuizzes: 1,
    totalScore: session.totalScore,
    [`byLesson.${session.lesson}.played`]: 1,
    [`byLesson.${session.lesson}.stars`]: stars,
  };
  if (correctCount === 8) incFields.perfectQuizzes = 1;

  await UserStats.findOneAndUpdate({ userId }, { $inc: incFields }, { upsert: true });

  // Conditional bestStreak update (atomic, no race condition risk for single-user flow)
  await UserStats.updateOne(
    { userId, bestStreak: { $lt: session.maxStreak } },
    { $set: { bestStreak: session.maxStreak } }
  );

  return {
    sessionId: session._id,
    grade: session.grade,
    language: session.language || 'en',
    lesson: session.lesson,
    difficulty: session.difficulty,
    completedAt: session.completedAt,
    totalScore: session.totalScore,
    starsEarned: stars,
    correctCount,
    maxStreak: session.maxStreak,
    timeSpentTotal: session.timeSpentTotal,
    lifelinesUsed: session.lifelinesUsed,
    perQuestion: _buildPerQuestionReview(session.questions),
  };
};

// ── getResultBySession ──────────────────────────────────────────────────────
const getResultBySession = async ({ sessionId, userId }) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }

  if (session.status !== 'completed') {
    const err = new Error('Quiz is not completed yet');
    err.statusCode = 400;
    throw err;
  }

  return {
    sessionId: session._id,
    grade: session.grade,
    language: session.language || 'en',
    lesson: session.lesson,
    difficulty: session.difficulty,
    totalScore: session.totalScore,
    starsEarned: session.starsEarned,
    correctCount: session.correctCount,
    maxStreak: session.maxStreak,
    timeSpentTotal: session.timeSpentTotal,
    completedAt: session.completedAt,
    lifelinesUsed: session.lifelinesUsed,
    perQuestion: _buildPerQuestionReview(session.questions),
  };
};

// ── explainQuestionAnswer ───────────────────────────────────────────────────
const explainQuestionAnswer = async ({ sessionId, questionIndex, language, userId }) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }

  if (session.status !== 'completed') {
    const err = new Error('Quiz must be completed before requesting explanations');
    err.statusCode = 400;
    throw err;
  }

  const qIndex = Number(questionIndex);
  if (!Number.isInteger(qIndex) || qIndex < 0 || qIndex >= session.questions.length) {
    const err = new Error('questionIndex is out of range');
    err.statusCode = 400;
    throw err;
  }

  const question = session.questions[qIndex];
  const lang = language || session.language || 'en';

  const resolveText = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.en || '';
  };

  const questionText = resolveText(question.questionText);
  const options = question.answers.map((a) => resolveText(a.text));
  const correctAnswerIndex = question.answers.findIndex((a) => a.isCorrect);

  const explanation = await explainAnswerWithAI({
    language: lang,
    questionText,
    options,
    userAnswerIndex: question.userAnswerIndex,
    correctAnswerIndex,
  });

  return {
    sessionId: session._id,
    questionIndex: qIndex,
    explanation,
  };
};

// ── getHistory ───────────────────────────────────────────────────────────────
const getHistory = async (userId) => {
  return QuizSession.find(
    { userId, status: 'completed' },
    { questions: 0 } // exclude large answers snapshot
  )
    .sort({ completedAt: -1 })
    .limit(10);
};

// ── getStats ─────────────────────────────────────────────────────────────────
const getStats = async (userId) => {
  let stats = await UserStats.findOne({ userId });
  if (!stats) {
    stats = await UserStats.create({ userId });
  }
  return stats;
};

// ── helpers ──────────────────────────────────────────────────────────────────
function _calculateStars(session, timeSpentTotal, correctCount) {
  const { timeMode, difficulty, timeLimit } = session;
  let stars = 0;

  if (timeMode === 'unlimited') {
    if (correctCount === 8) stars = 3;
    else if (correctCount >= 6) stars = 2;
    else if (correctCount >= 4) stars = 1;
    else stars = 0;
  } else {
    const limit = timeLimit || (timeMode === '8min' ? 480 : 960);
    const spent = timeSpentTotal || 0;
    const fraction = spent / limit;

    if (spent > limit) {
      // Time ran out
      stars = 0;
    } else if (fraction < 0.5 && correctCount >= 6) {
      stars = 3;
    } else if (fraction < 0.75 && correctCount >= 5) {
      stars = 2;
    } else if (correctCount >= 4) {
      stars = 1;
    } else {
      stars = 0;
    }
  }

  // Bonus star: Hard mode + ≥7 correct (cap at 4)
  if (difficulty === 'Hard' && correctCount >= 7) {
    stars = Math.min(stars + 1, 4);
  }

  return stars;
}

module.exports = {
  startQuiz,
  answerQuestion,
  useLifeline,
  completeQuiz,
  getHistory,
  getStats,
  getResultBySession,
  explainQuestionAnswer,
};
