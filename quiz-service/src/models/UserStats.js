const mongoose = require("mongoose");

const userStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    userName: { type: String, default: "" },

    // ── Legacy cumulative stats (kept for dashboard/leaderboard compat) ──
    totalStars:     { type: Number, default: 0 },
    totalQuizzes:   { type: Number, default: 0 },
    totalScore:     { type: Number, default: 0 },
    perfectQuizzes: { type: Number, default: 0 }, // games with 8/8 correct
    bestStreak:     { type: Number, default: 0 },
    byLesson: {
      Geometry: {
        played: { type: Number, default: 0 },
        stars:  { type: Number, default: 0 },
      },
      Algebra: {
        played: { type: Number, default: 0 },
        stars:  { type: Number, default: 0 },
      },
      Numbers: {
        played: { type: Number, default: 0 },
        stars:  { type: Number, default: 0 },
      },
    },

    // ── Ranking state ────────────────────────────────────────────────────
    // rankIndex: 0=Beginner … 8=Legend, 9=Legendary Sage
    rankIndex:            { type: Number, default: 0, min: 0, max: 9 },
    // tier: 1 (highest), 2, 3 (lowest within a rank)
    tier:                 { type: Number, default: 3, min: 1, max: 3 },
    starsInTier:          { type: Number, default: 0, min: 0 },
    // Star Protection Points (SPP) — shields a rank-star loss on Defeat; max 3
    starProtectionPoints: { type: Number, default: 0, min: 0, max: 3 },
    // Star Bonus Points (SBP) — 3 SBP auto-upgrades a Victory to Flawless; max 5
    starBonusPoints:      { type: Number, default: 0, min: 0, max: 5 },
    // Monotonic lifetime counter of rank stars earned
    lifetimeStarsEarned:  { type: Number, default: 0, min: 0 },
    // Stars earned after reaching Legendary Sage prestige
    legendarySageStars:   { type: Number, default: 0, min: 0 },

    // ── Profile XP track (separate from rank, never decreases) ──────────
    profileLevel: { type: Number, default: 1, min: 1 },
    profileXP:    { type: Number, default: 0, min: 0 },
    coins:        { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const UserStats = mongoose.model("UserStats", userStatsSchema);

module.exports = UserStats;
