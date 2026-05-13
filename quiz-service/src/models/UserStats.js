const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    userName: { type: String, default: '' },
    totalStars: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    perfectQuizzes: { type: Number, default: 0 }, // 8/8 correct
    bestStreak: { type: Number, default: 0 },
    byLesson: {
      Geometry: { played: { type: Number, default: 0 }, stars: { type: Number, default: 0 } },
      Algebra:  { played: { type: Number, default: 0 }, stars: { type: Number, default: 0 } },
      Numbers:  { played: { type: Number, default: 0 }, stars: { type: Number, default: 0 } },
    },
  },
  { timestamps: true }
);

const UserStats = mongoose.model('UserStats', userStatsSchema);

module.exports = UserStats;
