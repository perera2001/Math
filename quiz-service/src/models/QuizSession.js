const mongoose = require('mongoose');

const questionItemSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: {
      en: { type: String, default: '' },
      si: { type: String, default: '' },
      ta: { type: String, default: '' },
    },
    // answers snapshot — isCorrect stored server-side only, never sent to client
    answers: [{ text: { en: String, si: String, ta: String }, isCorrect: Boolean }],
    userAnswerIndex: { type: Number, default: null },
    isCorrect: { type: Boolean, default: null },
    timeSpent: { type: Number, default: 0 },
  },
  { _id: true }
);

const quizSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    grade: { type: Number, enum: [9, 10, 11], required: true },
    language: { type: String, enum: ['en', 'si', 'ta'], default: 'en' },
    lesson: { type: String, enum: ['Geometry', 'Algebra', 'Numbers'], required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    timeMode: { type: String, enum: ['8min', '16min', 'unlimited'], required: true },
    timeLimit: { type: Number, default: null }, // seconds; null for unlimited
    questions: [questionItemSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    starsEarned: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    timeSpentTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    lifelinesUsed: {
      fiftyFifty: { type: Boolean, default: false },
      skip: { type: Boolean, default: false },
      extraTime: { type: Boolean, default: false },
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

quizSessionSchema.index({ userId: 1, status: 1 });

const QuizSession = mongoose.model('QuizSession', quizSessionSchema);

module.exports = QuizSession;
