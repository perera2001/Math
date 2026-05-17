const mongoose = require("mongoose");
const QuizSession = require("../models/QuizSession");
const UserStats = require("../models/UserStats");
const {
  explainAnswer: explainAnswerWithAI,
} = require("./aiExplanationService");
const { resolveGameResult } = require("./rankingService");

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
    answers: [
      { text: { en: String, si: String, ta: String }, isCorrect: Boolean },
    ],
    grade: Number,
  },
  { collection: "questions" },
);
// Avoid OverwriteModelError on hot-reload
const Question =
  mongoose.models.QuizQuestion ||
  mongoose.model("QuizQuestion", QuestionSchema);

// New fixed scoring: 100 pts for 1st-attempt correct, 50 pts for 2nd-attempt
const POINTS_FIRST_ATTEMPT = 100;
const POINTS_SECOND_ATTEMPT = 50;
const MAX_GAME_POINTS = 800; // 8 × 100

const TIME_LIMITS = { "8min": 480, "16min": 960, unlimited: null };

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
      attemptCount: q.attemptCount || 1,
    };
  });

// ── startQuiz ────────────────────────────────────────────────────────────────
const startQuiz = async ({
  grade,
  lesson,
  difficulty,
  timeMode,
  language = "en",
  userId,
}) => {
  // Use $sample to pick 8 random questions directly from the shared collection
  const selected = await Question.aggregate([
    { $match: { lesson, difficulty, grade: Number(grade) } },
    { $sample: { size: 8 } },
  ]);

  if (!selected || selected.length < 8) {
    const err = new Error("Not enough questions");
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
const answerQuestion = async ({
  sessionId,
  questionIndex,
  answerIndex,
  timeSpent,
  userId,
}) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }
  if (session.status !== "in_progress") {
    const err = new Error("Session is not in progress");
    err.statusCode = 400;
    throw err;
  }

  const question = session.questions[questionIndex];
  if (!question) {
    const err = new Error("Question index out of range");
    err.statusCode = 400;
    throw err;
  }

  const isCorrect = question.answers[answerIndex]?.isCorrect === true;
  const correctAnswerIndex = question.answers.findIndex((a) => a.isCorrect);

  // Track attempt count per question
  question.attemptCount = (question.attemptCount || 0) + 1;
  question.userAnswerIndex = answerIndex;
  question.isCorrect = isCorrect;
  question.timeSpent = timeSpent || 0;

  if (isCorrect) {
    session.currentStreak += 1;
    if (session.currentStreak > session.maxStreak) {
      session.maxStreak = session.currentStreak;
    }
    // Fixed scoring: 100 for first attempt, 50 for any subsequent attempt
    const pts =
      question.attemptCount === 1
        ? POINTS_FIRST_ATTEMPT
        : POINTS_SECOND_ATTEMPT;
    session.totalScore += pts;
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
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }
  if (session.status !== "in_progress") {
    const err = new Error("Session is not in progress");
    err.statusCode = 400;
    throw err;
  }
  if (session.lifelinesUsed[type]) {
    const err = new Error(`Lifeline '${type}' already used`);
    err.statusCode = 400;
    throw err;
  }
  if (type === "extraTime" && session.timeMode === "unlimited") {
    const err = new Error("Extra time is not available in unlimited mode");
    err.statusCode = 400;
    throw err;
  }

  session.lifelinesUsed[type] = true;

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const result = {};

  if (type === "fiftyFifty") {
    const wrongIndices = currentQuestion.answers
      .map((a, i) => ({ i, isCorrect: a.isCorrect }))
      .filter((a) => !a.isCorrect)
      .map((a) => a.i)
      .sort(() => Math.random() - 0.5);

    result.hideIndices = wrongIndices.slice(
      0,
      Math.min(2, wrongIndices.length),
    );
  } else if (type === "skip") {
    currentQuestion.userAnswerIndex = null;
    currentQuestion.isCorrect = false;
    session.currentStreak = 0;
    session.currentQuestionIndex += 1;
    result.skipped = true;
    result.newQuestionIndex = session.currentQuestionIndex;
  } else if (type === "extraTime") {
    // Client handles the +30s display; server only records use
    result.extraTime = 30;
  }

  await session.save();
  return result;
};

// ── completeQuiz ─────────────────────────────────────────────────────────────
const completeQuiz = async ({
  sessionId,
  timeSpentTotal,
  userId,
  userName,
}) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }
  if (session.status !== "in_progress") {
    const err = new Error("Session already completed");
    err.statusCode = 400;
    throw err;
  }

  const correctCount = session.questions.filter((q) => q.isCorrect).length;
  // totalScore is already the sum of per-question awards (100/50/0)

  session.starsEarned = correctCount; // kept for backward compat (0–8 range)
  session.correctCount = correctCount;
  session.timeSpentTotal = timeSpentTotal || 0;
  session.status = "completed";
  session.completedAt = new Date();

  // ── Fetch current rank state ───────────────────────────────────────────
  let statsDoc = await UserStats.findOne({ userId });
  if (!statsDoc) {
    statsDoc = await UserStats.create({ userId });
  }

  const currentRankState = {
    rankIndex: statsDoc.rankIndex,
    tier: statsDoc.tier,
    starsInTier: statsDoc.starsInTier,
    starProtectionPoints: statsDoc.starProtectionPoints,
    starBonusPoints: statsDoc.starBonusPoints,
    lifetimeStarsEarned: statsDoc.lifetimeStarsEarned,
    legendarySageStars: statsDoc.legendarySageStars,
    profileLevel: statsDoc.profileLevel,
    profileXP: statsDoc.profileXP,
    coins: statsDoc.coins,
  };

  // ── Run ranking logic ──────────────────────────────────────────────────
  const { newState, gameResult } = resolveGameResult(
    currentRankState,
    session.totalScore,
  );

  session.gameOutcome = gameResult.outcome;
  session.rankResult = gameResult;
  await session.save();

  // ── Atomically update UserStats ────────────────────────────────────────
  const incFields = {
    totalStars: correctCount, // legacy star counter
    totalQuizzes: 1,
    totalScore: session.totalScore,
    [`byLesson.${session.lesson}.played`]: 1,
    [`byLesson.${session.lesson}.stars`]: correctCount,
  };
  if (correctCount === 8) incFields.perfectQuizzes = 1;

  await UserStats.findOneAndUpdate(
    { userId },
    {
      $inc: incFields,
      $set: {
        rankIndex: newState.rankIndex,
        tier: newState.tier,
        starsInTier: newState.starsInTier,
        starProtectionPoints: newState.starProtectionPoints,
        starBonusPoints: newState.starBonusPoints,
        lifetimeStarsEarned: newState.lifetimeStarsEarned,
        legendarySageStars: newState.legendarySageStars,
        profileLevel: newState.profileLevel,
        profileXP: newState.profileXP,
        coins: newState.coins,
        ...(userName ? { userName } : {}),
      },
    },
    { upsert: true },
  );

  // bestStreak conditional update
  await UserStats.updateOne(
    { userId, bestStreak: { $lt: session.maxStreak } },
    { $set: { bestStreak: session.maxStreak } },
  );

  return {
    sessionId: session._id,
    grade: session.grade,
    language: session.language || "en",
    lesson: session.lesson,
    difficulty: session.difficulty,
    completedAt: session.completedAt,
    totalScore: session.totalScore,
    starsEarned: session.starsEarned,
    correctCount,
    maxStreak: session.maxStreak,
    timeSpentTotal: session.timeSpentTotal,
    lifelinesUsed: session.lifelinesUsed,
    perQuestion: _buildPerQuestionReview(session.questions),
    // ── New ranking fields ─────────────────────────────────────────────
    rankResult: gameResult,
    newRankState: newState,
  };
};

// ── getResultBySession ──────────────────────────────────────────────────────
const getResultBySession = async ({ sessionId, userId }) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  if (session.status !== "completed") {
    const err = new Error("Quiz is not completed yet");
    err.statusCode = 400;
    throw err;
  }

  return {
    sessionId: session._id,
    grade: session.grade,
    language: session.language || "en",
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
    rankResult: session.rankResult || null,
    // Reconstruct newRankState from fields stored inside rankResult
    newRankState: session.rankResult ? {
      rankIndex: session.rankResult.newRankIndex ?? 0,
      tier:      session.rankResult.newRankTier   ?? 3,
      starsInTier:           session.rankResult.newStarsInTier ?? (session.rankResult.rankStarsAfter ?? 0),
      starProtectionPoints:  session.rankResult.newSPP ?? 0,
      starBonusPoints:       session.rankResult.newSBP ?? 0,
    } : null,
  };
};

// ── explainQuestionAnswer ───────────────────────────────────────────────────
const explainQuestionAnswer = async ({
  sessionId,
  questionIndex,
  language,
  userId,
}) => {
  const session = await QuizSession.findById(sessionId);

  if (!session || session.userId.toString() !== String(userId)) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  if (session.status !== "completed") {
    const err = new Error(
      "Quiz must be completed before requesting explanations",
    );
    err.statusCode = 400;
    throw err;
  }

  const qIndex = Number(questionIndex);
  if (
    !Number.isInteger(qIndex) ||
    qIndex < 0 ||
    qIndex >= session.questions.length
  ) {
    const err = new Error("questionIndex is out of range");
    err.statusCode = 400;
    throw err;
  }

  const question = session.questions[qIndex];
  const lang = language || session.language || "en";

  const resolveText = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || "";
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
    { userId, status: "completed" },
    { questions: 0 }, // exclude large answers snapshot
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

// ── getLeaderboard ──────────────────────────────────────────────────────────
const getLeaderboard = async ({ lesson } = {}) => {
  const VALID_LESSONS = ["Geometry", "Algebra", "Numbers"];
  const isLesson = lesson && VALID_LESSONS.includes(lesson);

  // Sort by rank (rankIndex desc, tier asc=better, starsInTier desc), then legacy score
  const sortField = isLesson
    ? { [`byLesson.${lesson}.stars`]: -1, [`byLesson.${lesson}.played`]: -1 }
    : {
        rankIndex: -1,
        tier: 1, // 1 is highest, so ascending = better first
        starsInTier: -1,
        lifetimeStarsEarned: -1,
        totalScore: -1,
      };

  const entries = await UserStats.find().sort(sortField).limit(50).lean();

  return entries.map((entry, idx) => ({
    rank: idx + 1,
    userId: entry.userId,
    userName: entry.userName || "Anonymous",
    totalStars: entry.totalStars,
    totalScore: entry.totalScore,
    totalQuizzes: entry.totalQuizzes,
    perfectQuizzes: entry.perfectQuizzes,
    bestStreak: entry.bestStreak,
    // Ranking fields
    rankIndex: entry.rankIndex ?? 0,
    tier: entry.tier ?? 3,
    starsInTier: entry.starsInTier ?? 0,
    lifetimeStarsEarned: entry.lifetimeStarsEarned ?? 0,
    profileLevel: entry.profileLevel ?? 1,
    coins: entry.coins ?? 0,
    lessonStars: isLesson ? (entry.byLesson?.[lesson]?.stars ?? 0) : null,
    lessonPlayed: isLesson ? (entry.byLesson?.[lesson]?.played ?? 0) : null,
    byLesson: entry.byLesson,
  }));
};

module.exports = {
  startQuiz,
  answerQuestion,
  useLifeline,
  completeQuiz,
  getHistory,
  getStats,
  getResultBySession,
  explainQuestionAnswer,
  getLeaderboard,
};
