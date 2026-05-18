/**
 * MathsApp — MLBB-Style Ranking & Reward System
 * ─────────────────────────────────────────────
 *
 * RANK STRUCTURE (rankIndex 0–8, prestige 9):
 *   0 Beginner    | 3 stars/tier
 *   1 Learner     | 3 stars/tier
 *   2 Apprentice  | 4 stars/tier
 *   3 Skilled     | 4 stars/tier
 *   4 Expert      | 5 stars/tier
 *   5 Master      | 5 stars/tier
 *   6 Grandmaster | 6 stars/tier
 *   7 Mythic      | 7 stars/tier
 *   8 Legend      | 8 stars/tier
 *   9 Legendary Sage (prestige — no demotion possible)
 *
 * Each rank has 3 tiers: Tier 3 (lowest) → Tier 2 → Tier 1 (highest).
 * New player starts at Beginner Tier 3, 0 stars.
 *
 * GAME SCORING (new fixed system):
 *   Each of 8 questions: +100 pts (1st-attempt correct) | +50 pts (2nd-attempt) | 0 pts
 *   Max game score: 800 pts
 *   gamePercent = (gamePoints / 800) × 100
 *
 * OUTCOMES:
 *   Flawless  ≥87.5%  → +2 rank stars, +200 XP, +5 coins, +2 SBP
 *   Victory   ≥62.5%  → +1 rank star,  +120 XP, +3 coins, +1 SBP
 *   Draw      ≥37.5%  →  0 rank stars,  +60 XP, +1 coin,  +1 SPP
 *   Defeat    <37.5%  → see Defeat logic, +30 XP, 0 coins, +1 SPP
 *
 * SBP AUTO-REDEMPTION (checked before rewards applied):
 *   On Victory: if SBP >= 3 → spend 3 SBP → upgrade to Flawless rewards ("Bonus-Boosted")
 *   On Flawless: if SBP = 5 (cap) → spend ALL 5 SBP → drain to 0, then rebuild
 *
 * DEFEAT LOGIC:
 *   if SPP > 0 : consume 1 SPP → 0 stars lost → gain +1 SPP (net unchanged or capped)
 *   if SPP == 0: lose 1 rank star → gain +1 SPP
 *
 * PROMOTION (fills current tier → moves to next tier/rank):
 *   Tier 3→2→1 within same rank. Tier 1 full → next rank's Tier 3.
 *   Legend Tier 1 completed → Legendary Sage (rankIndex = 9).
 *
 * DEMOTION (friendly):
 *   Star lost at 0 stars in tier → drop to previous tier at (starsPerTier − 1) stars.
 *   Floor: cannot drop below Tier 3 of the CURRENT rank.
 *   Legendary Sage cannot be demoted.
 *
 * CAPS: SPP max = 3, SBP max = 5.
 *
 * PROFILE XP (separate, never decreases):
 *   xpForLevel(N) = 100 + (N − 1) × 150
 *   Level 1: 100 XP, Level 2: 250 XP, Level 3: 400 XP, ...
 */

"use strict";

const RANK_CONFIG = [
  { rank: "Beginner", starsPerTier: 3 },
  { rank: "Learner", starsPerTier: 3 },
  { rank: "Apprentice", starsPerTier: 4 },
  { rank: "Skilled", starsPerTier: 4 },
  { rank: "Expert", starsPerTier: 5 },
  { rank: "Master", starsPerTier: 5 },
  { rank: "Grandmaster", starsPerTier: 6 },
  { rank: "Mythic", starsPerTier: 7 },
  { rank: "Legend", starsPerTier: 8 },
];

const LEGENDARY_SAGE_INDEX = 9;
const SPP_CAP = 3;
const SBP_CAP = 5;

/**
 * XP required to advance FROM level N to level N+1.
 * @param {number} n  Current level (1-based)
 */
function xpForLevel(n) {
  return 100 + (n - 1) * 150;
}

/**
 * Derive profile level, XP within that level, and XP needed for next level,
 * from the player's total accumulated profile XP.
 * @param {number} totalXP
 * @returns {{ level: number, xpInLevel: number, xpToNext: number }}
 */
function computeProfileLevel(totalXP) {
  let level = 1;
  let remaining = Math.max(0, totalXP);
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, xpInLevel: remaining, xpToNext: xpForLevel(level) };
}

/**
 * Return a human-readable rank label like "Skilled 2" or "Legendary Sage".
 * @param {{ rankIndex: number, tier: number }} state
 */
function getRankLabel(state) {
  if (state.rankIndex >= LEGENDARY_SAGE_INDEX) return "Legendary Sage";
  const cfg = RANK_CONFIG[state.rankIndex];
  return `${cfg.rank} ${state.tier}`;
}

/**
 * Pure function that resolves a completed game into rank/XP/coin changes.
 *
 * @param {object} currentState - The player's current rank state:
 *   {
 *     rankIndex: number,           // 0–9
 *     tier: number,                // 1, 2, or 3
 *     starsInTier: number,
 *     starProtectionPoints: number, // SPP 0–3
 *     starBonusPoints: number,      // SBP 0–5
 *     lifetimeStarsEarned: number,
 *     legendarySageStars: number,
 *     profileLevel: number,
 *     profileXP: number,
 *     coins: number,
 *   }
 * @param {number} gamePoints - Total game score (0–800)
 * @returns {{ newState: object, gameResult: object }}
 */
function resolveGameResult(currentState, gamePoints) {
  // Deep-copy state so we never mutate the caller's object
  const state = {
    rankIndex: currentState.rankIndex ?? 0,
    tier: currentState.tier ?? 3,
    starsInTier: currentState.starsInTier ?? 0,
    starProtectionPoints: currentState.starProtectionPoints ?? 0,
    starBonusPoints: currentState.starBonusPoints ?? 0,
    lifetimeStarsEarned: currentState.lifetimeStarsEarned ?? 0,
    legendarySageStars: currentState.legendarySageStars ?? 0,
    profileLevel: currentState.profileLevel ?? 1,
    profileXP: currentState.profileXP ?? 0,
    coins: currentState.coins ?? 0,
  };

  // ── STEP 1: Determine outcome ───────────────────────────────────────────
  const gamePercent = (gamePoints / 800) * 100;
  let outcome;
  if (gamePercent >= 87.5) outcome = "Flawless";
  else if (gamePercent >= 62.5) outcome = "Victory";
  else if (gamePercent >= 37.5) outcome = "Draw";
  else outcome = "Defeat";

  let bonusBoosted = false;
  let protectionUsed = false;

  // ── STEP 2: SBP auto-redemption ──────────────────────────────────────────
  // Victory with 3+ diamonds → upgrade to Flawless
  if (outcome === "Victory" && state.starBonusPoints >= 3) {
    state.starBonusPoints -= 3;
    outcome = "Flawless";
    bonusBoosted = true;
  }
  // Flawless with all 5 diamonds → full-cap drain: spend all, reset to 0
  if (outcome === "Flawless" && !bonusBoosted && state.starBonusPoints >= SBP_CAP) {
    state.starBonusPoints = 0;
    bonusBoosted = true;
  }

  // ── STEP 3: XP, coins, and SPP/SBP deltas ──────────────────────────────
  let xpAwarded = 0;
  let coinsAwarded = 0;
  let sbpGain = 0;
  let sppGain = 0;
  let rankStarChange = 0;

  switch (outcome) {
    case "Flawless":
      xpAwarded = 200;
      coinsAwarded = 5;
      // Boosted Flawless: no SBP gain (let it drain and rebuild from zero)
      // Real Flawless: +1 SBP (slower fill so bonus feels earned, not permanent)
      sbpGain = bonusBoosted ? 0 : 1;
      rankStarChange = 2;
      break;
    case "Victory":
      xpAwarded = 120;
      coinsAwarded = 3;
      sbpGain = 1;
      rankStarChange = 1;
      break;
    case "Draw":
      xpAwarded = 60;
      coinsAwarded = 1;
      sppGain = 1;
      rankStarChange = 0;
      break;
    case "Defeat":
      xpAwarded = 30;
      coinsAwarded = 0;
      sppGain = 1;
      rankStarChange = -1;
      break;
  }

  // ── STEP 4: Defeat protection ───────────────────────────────────────────
  if (outcome === "Defeat" && state.starProtectionPoints > 0) {
    state.starProtectionPoints -= 1; // consume
    protectionUsed = true;
    rankStarChange = 0; // no star lost
    sppGain = 1; // re-gain 1 SPP (builds back up)
  }

  // Snapshot before applying changes (for GameResult reporting)
  const rankIndexBefore = state.rankIndex;
  const tierBefore = state.tier;
  const starsInTierBefore = state.starsInTier;
  const rankLabelBefore = getRankLabel(state);

  // ── STEP 5: Apply SPP/SBP gains ────────────────────────────────────────
  state.starBonusPoints += sbpGain;
  state.starProtectionPoints += sppGain;

  // ── STEP 6: Cascade promotion / demotion ────────────────────────────────
  if (state.rankIndex >= LEGENDARY_SAGE_INDEX) {
    // Legendary Sage: just accrue prestige stars
    if (rankStarChange > 0) {
      state.legendarySageStars += rankStarChange;
    }
  } else {
    state.starsInTier += rankStarChange;

    // Promotion cascade (handles +2 jumping across a tier)
    while (state.rankIndex < LEGENDARY_SAGE_INDEX) {
      const cfg = RANK_CONFIG[state.rankIndex];
      if (state.starsInTier < cfg.starsPerTier) break;

      const overflow = state.starsInTier - cfg.starsPerTier;

      if (state.tier === 1) {
        if (state.rankIndex === 8) {
          // Legend Tier 1 complete → Legendary Sage
          state.rankIndex = LEGENDARY_SAGE_INDEX;
          state.tier = 1;
          state.starsInTier = 0;
          // Any overflow becomes prestige stars
          state.legendarySageStars += overflow;
          break;
        } else {
          state.rankIndex++;
          state.tier = 3;
          state.starsInTier = overflow;
        }
      } else {
        state.tier--;
        state.starsInTier = overflow;
      }
    }

    // Demotion (star went below 0)
    if (state.rankIndex < LEGENDARY_SAGE_INDEX && state.starsInTier < 0) {
      if (state.tier === 3) {
        // ── RANK FLOOR: can't drop below Tier 3 of current rank ────────
        state.starsInTier = 0;
      } else {
        // Drop one tier within same rank
        state.tier++;
        const cfg = RANK_CONFIG[state.rankIndex];
        state.starsInTier = cfg.starsPerTier - 1 + state.starsInTier;
        // Clamp again (shouldn't happen with ≤1 star change, but be safe)
        if (state.starsInTier < 0) state.starsInTier = 0;
      }
    }
  }

  // ── STEP 7: Apply XP and coins ─────────────────────────────────────────
  state.profileXP += xpAwarded;
  state.coins += coinsAwarded;

  // Lifetime stars counter (monotonic)
  if (rankStarChange > 0) {
    state.lifetimeStarsEarned += rankStarChange;
  }

  // ── STEP 8: Apply caps ──────────────────────────────────────────────────
  if (state.starProtectionPoints > SPP_CAP)
    state.starProtectionPoints = SPP_CAP;
  if (state.starBonusPoints > SBP_CAP) state.starBonusPoints = SBP_CAP;

  // ── STEP 9: Recompute profile level ────────────────────────────────────
  const { level, xpInLevel, xpToNext } = computeProfileLevel(state.profileXP);
  state.profileLevel = level;

  // ── Build GameResult ────────────────────────────────────────────────────
  const rankLabelAfter = getRankLabel(state);
  const rankChanged = rankLabelAfter !== rankLabelBefore;
  const promoted =
    rankChanged &&
    (state.rankIndex > rankIndexBefore ||
      (state.rankIndex === rankIndexBefore && state.tier < tierBefore));
  const demoted =
    rankChanged &&
    (state.rankIndex < rankIndexBefore ||
      (state.rankIndex === rankIndexBefore && state.tier > tierBefore));

  const gameResult = {
    gamePoints,
    gamePercent: Math.round(gamePercent * 10) / 10,
    outcome: bonusBoosted ? "Flawless" : outcome,
    bonusBoosted,
    protectionUsed,
    rankStarsBefore: starsInTierBefore,
    rankStarsAfter: state.starsInTier,
    rankChanged,
    promoted,
    demoted,
    xpAwarded,
    coinsAwarded,
    newRank: rankLabelAfter,
    prevRank: rankLabelBefore,
    xpInLevel,
    xpToNext,
    profileLevel: state.profileLevel,
    // Stored so getResultBySession can reconstruct newRankState without refetching UserStats
    newRankIndex: state.rankIndex,
    newRankTier: state.tier,
    newStarsInTier: state.starsInTier,
    newSPP: state.starProtectionPoints,
    newSBP: state.starBonusPoints,
  };

  return { newState: state, gameResult };
}

module.exports = {
  resolveGameResult,
  getRankLabel,
  computeProfileLevel,
  xpForLevel,
  RANK_CONFIG,
  LEGENDARY_SAGE_INDEX,
  SPP_CAP,
  SBP_CAP,
};
