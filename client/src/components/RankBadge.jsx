/**
 * RankBadge — Displays a player's current rank with unique icon, gradient,
 * tier label, and star pips. Used in QuizPlay HUD, Results screen, Profile.
 *
 * Props:
 *   rankIndex   {number}  0–9
 *   tier        {number}  1, 2, or 3
 *   starsInTier {number}
 *   size        {"sm"|"md"|"lg"}  — default "md"
 *   showPips    {boolean} — show star pips, default true
 *   showLabel   {boolean} — show rank name + tier text, default true
 */
import React from "react";

// ── Rank configuration ──────────────────────────────────────────────────────
export const RANK_CONFIG = [
  { rank: "Beginner",    starsPerTier: 3 },
  { rank: "Learner",     starsPerTier: 3 },
  { rank: "Apprentice",  starsPerTier: 4 },
  { rank: "Skilled",     starsPerTier: 4 },
  { rank: "Expert",      starsPerTier: 5 },
  { rank: "Master",      starsPerTier: 5 },
  { rank: "Grandmaster", starsPerTier: 6 },
  { rank: "Mythic",      starsPerTier: 7 },
  { rank: "Legend",      starsPerTier: 8 },
];

export const LEGENDARY_SAGE_INDEX = 9;

// Rank icons (SVG paths / emoji) — unique per rank
const RANK_ICONS = [
  "🌱", // Beginner     — seedling
  "📖", // Learner      — open book
  "⚒️", // Apprentice   — tools
  "⚔️", // Skilled      — crossed swords
  "🔬", // Expert       — microscope
  "🏛️", // Master       — temple
  "👑", // Grandmaster  — crown
  "🌀", // Mythic       — vortex
  "🐉", // Legend       — dragon
  "✨", // Legendary Sage — sparkles
];

// Gradient backgrounds per rank (for profile header)
export const RANK_GRADIENTS = [
  "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",             // Beginner – fresh green
  "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",             // Learner – sky blue
  "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",             // Apprentice – violet
  "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",             // Skilled – orange
  "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",             // Expert – pink
  "linear-gradient(135deg, #e879f9 0%, #d946ef 100%)",             // Master – fuchsia
  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",             // Grandmaster – amber
  "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",             // Mythic – cyan
  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",             // Legend – red
  "linear-gradient(135deg, #fbbf24 0%, #a78bfa 60%, #ef4444 100%)", // Legendary Sage – rainbow
];

// Card/accent colours per rank
export const RANK_ACCENT = [
  "#22c55e",  // Beginner
  "#3b82f6",  // Learner
  "#8b5cf6",  // Apprentice
  "#f97316",  // Skilled
  "#ec4899",  // Expert
  "#d946ef",  // Master
  "#f59e0b",  // Grandmaster
  "#0ea5e9",  // Mythic
  "#ef4444",  // Legend
  "#fbbf24",  // Legendary Sage
];

/**
 * Returns a human-readable label like "Skilled 2" or "Legendary Sage".
 */
export function getRankLabel(rankIndex, tier) {
  if (rankIndex >= LEGENDARY_SAGE_INDEX) return "Legendary Sage";
  return `${RANK_CONFIG[rankIndex]?.rank ?? "Unknown"} ${tier}`;
}

export function getStarsPerTier(rankIndex) {
  if (rankIndex >= LEGENDARY_SAGE_INDEX) return 0;
  return RANK_CONFIG[rankIndex]?.starsPerTier ?? 3;
}

// ── Component ───────────────────────────────────────────────────────────────
const RankBadge = ({
  rankIndex = 0,
  tier = 3,
  starsInTier = 0,
  size = "md",
  showPips = true,
  showLabel = true,
}) => {
  const idx      = Math.min(Math.max(rankIndex, 0), LEGENDARY_SAGE_INDEX);
  const isSage   = idx >= LEGENDARY_SAGE_INDEX;
  const rankName = isSage ? "Legendary Sage" : (RANK_CONFIG[idx]?.rank ?? "Beginner");
  const icon     = RANK_ICONS[idx] ?? "🌱";
  const accent   = RANK_ACCENT[idx] ?? "#22c55e";
  const gradient = RANK_GRADIENTS[idx] ?? RANK_GRADIENTS[0];
  const spt      = isSage ? 0 : (RANK_CONFIG[idx]?.starsPerTier ?? 3);
  const clampedStars = Math.min(Math.max(starsInTier, 0), spt);

  const sizes = {
    sm: { badge: 36, icon: "1.2rem", name: "0.7rem", tier: "0.6rem", pip: 8 },
    md: { badge: 52, icon: "1.8rem", name: "0.9rem", tier: "0.75rem", pip: 10 },
    lg: { badge: 80, icon: "2.6rem", name: "1.2rem", tier: "0.95rem", pip: 13 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className="rank-badge-wrapper"
      style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}
      aria-label={`Rank: ${getRankLabel(idx, tier)}, ${clampedStars}/${spt} stars`}
    >
      {/* Icon circle */}
      <div
        style={{
          width:  s.badge,
          height: s.badge,
          borderRadius: "50%",
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: s.icon,
          boxShadow: `0 0 12px ${accent}88, 0 2px 8px rgba(0,0,0,0.3)`,
          border: `2px solid ${accent}`,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {showLabel && (
        <div style={{ textAlign: "center", lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, fontSize: s.name, color: accent, whiteSpace: "nowrap" }}>
            {rankName}
          </div>
          {!isSage && (
            <div style={{ fontSize: s.tier, color: "#94a3b8", fontWeight: 600 }}>
              Tier {tier}
            </div>
          )}
        </div>
      )}

      {showPips && !isSage && spt > 0 && (
        <div style={{ display: "flex", gap: "2px", justifyContent: "center", flexWrap: "wrap", maxWidth: spt * (s.pip + 3) }}>
          {Array.from({ length: spt }, (_, i) => (
            <div
              key={i}
              style={{
                width: s.pip,
                height: s.pip,
                borderRadius: "50%",
                background: i < clampedStars ? accent : "rgba(148,163,184,0.3)",
                boxShadow: i < clampedStars ? `0 0 4px ${accent}` : "none",
                border: `1px solid ${i < clampedStars ? accent : "rgba(148,163,184,0.5)"}`,
                transition: "all 0.3s ease",
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RankBadge;
