import React, { useEffect, useState, useCallback } from "react";
import { quizAPI } from "../api/quizApi";
import { useAuth } from "../context/AuthContext";
import { useUILang } from "../context/UILanguageContext";
import RankBadge, { LEGENDARY_SAGE_INDEX } from "../components/RankBadge";

const SUBJECTS = [
  { key: "all", label: "All Subjects", icon: "🌐", accent: "teal" },
  { key: "Geometry", label: "Geometry", icon: "📐", accent: "blue" },
  { key: "Algebra", label: "Algebra", icon: "🔢", accent: "cyan" },
  { key: "Numbers", label: "Numbers", icon: "🔣", accent: "pink" },
];

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Leaderboard() {
  const { user } = useAuth();
  const { t } = useUILang();

  const [activeSubject, setActiveSubject] = useState("all");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async (subject) => {
    setLoading(true);
    setError(null);
    try {
      const lesson = subject === "all" ? undefined : subject;
      const res = await quizAPI.getLeaderboard(lesson);
      setEntries(res.data?.leaderboard || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activeSubject);
  }, [activeSubject, fetchLeaderboard]);

  const handleSubject = (key) => {
    if (key !== activeSubject) setActiveSubject(key);
  };

  const activeConfig = SUBJECTS.find((s) => s.key === activeSubject);

  const getDisplayStat = (entry) => {
    if (activeSubject === "all") return entry.totalStars;
    return entry.lessonStars ?? 0;
  };

  const getSecondStat = (entry) => {
    if (activeSubject === "all")
      return entry.totalScore?.toLocaleString() ?? "0";
    return `${entry.lessonPlayed ?? 0} played`;
  };

  return (
    <div className="sd-page lb-page">
      <div className="lb-layout">
        {/* ══ LEFT — leaderboard ═════════════════════════════════════ */}
        <div className="lb-main">
          {/* Header */}
          <div className="sd-header">
            <div className="sd-welcome-text">
              <h1>🏆 Leaderboard</h1>
              <p className="sd-header-sub">
                See how you rank against other students
              </p>
            </div>
          </div>

          {/* Subject filter bar */}
          <div className="lb-filter-bar">
            {SUBJECTS.map(({ key, label, icon }) => (
              <button
                key={key}
                className={`lb-filter-btn${activeSubject === key ? " lb-filter-btn--active" : ""}`}
                onClick={() => handleSubject(key)}
              >
                <span className="lb-filter-icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Rankings card */}
          <div
            className={`sd-card sd-accent-${activeConfig?.accent ?? "teal"} lb-card`}
          >
            <div className="sd-card-header">
              <div
                className={`sd-card-header-icon sd-icon-${activeConfig?.accent ?? "teal"}`}
              >
                {activeConfig?.icon}
              </div>
              <div>
                <div className="sd-card-title">
                  {activeConfig?.label} Rankings
                </div>
                <div className="sd-card-subtitle">
                  {activeSubject === "all"
                    ? "Ranked by total stars earned"
                    : `Ranked by stars in ${activeConfig?.label}`}
                </div>
              </div>
            </div>

            <div className="sd-card-body">
              {loading && (
                <div className="lb-state">
                  <div className="lb-spinner" />
                  <span>Loading rankings…</span>
                </div>
              )}

              {!loading && error && (
                <div className="lb-state lb-state--error">
                  <span>⚠ {error}</span>
                  <button
                    className="lb-retry-btn"
                    onClick={() => fetchLeaderboard(activeSubject)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && entries.length === 0 && (
                <div className="lb-state sd-empty">
                  <span className="lb-empty-icon">🏅</span>
                  <p>No rankings yet. Complete quizzes to appear here!</p>
                </div>
              )}

              {!loading && !error && entries.length > 0 && (
                <div className="lb-list">
                  <div className="lb-row lb-row--header">
                    <span className="lb-col lb-col-rank">#</span>
                    <span className="lb-col lb-col-user">Student</span>
                    <span className="lb-col lb-col-stars">⭐ Stars</span>
                    <span className="lb-col lb-col-score">Score</span>
                    <span className="lb-col lb-col-quizzes">Quizzes</span>
                    <span className="lb-col lb-col-streak">Streak</span>
                  </div>

                  {entries.map((entry) => {
                    const isMe =
                      String(entry.userId) === String(user?._id || user?.id);
                    return (
                      <div
                        key={entry.userId}
                        className={`lb-row${isMe ? " lb-row--me" : ""}${entry.rank <= 3 ? " lb-row--top3" : ""}`}
                      >
                        <span className="lb-col lb-col-rank">
                          {MEDAL[entry.rank] || (
                            <span className="lb-rank-num">{entry.rank}</span>
                          )}
                        </span>
                        <span className="lb-col lb-col-user">
                          <span
                            className={`lb-avatar lb-avatar--${activeConfig?.accent ?? "teal"}`}
                          >
                            {entry.userName?.charAt(0).toUpperCase() || "?"}
                          </span>
                          <span className="lb-username">
                            {entry.userName}
                            {isMe && <span className="lb-you-badge">You</span>}
                          </span>
                        </span>
                        <span
                          className="lb-col lb-col-stars lb-stat-primary"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          {activeSubject === "all" &&
                          entry.rankIndex != null ? (
                            <RankBadge
                              rankIndex={Math.min(
                                entry.rankIndex ?? 0,
                                LEGENDARY_SAGE_INDEX,
                              )}
                              tier={entry.tier ?? 3}
                              starsInTier={entry.starsInTier ?? 0}
                              size="sm"
                              showPips={false}
                            />
                          ) : (
                            <>
                              {getDisplayStat(entry)}
                              <span className="lb-star-icon">★</span>
                            </>
                          )}
                        </span>
                        <span className="lb-col lb-col-score lb-stat-secondary">
                          {getSecondStat(entry)}
                        </span>
                        <span className="lb-col lb-col-quizzes lb-stat-muted">
                          {entry.totalQuizzes}
                        </span>
                        <span className="lb-col lb-col-streak lb-stat-muted">
                          {entry.bestStreak}🔥
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ RIGHT — decorative panel ══════════════════════════════ */}
        <div className="lb-side-panel">
          {/* Background image */}
          <img
            className="lb-side-bg"
            src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=700&q=80"
            alt=""
            aria-hidden="true"
          />
          {/* Gradient overlay */}
          <div className="lb-side-overlay" />

          {/* Floating math decorations */}
          <span className="lb-deco lb-deco-1">∑</span>
          <span className="lb-deco lb-deco-2">π</span>
          <span className="lb-deco lb-deco-3">∞</span>
          <span className="lb-deco lb-deco-4">√</span>
          <span className="lb-deco lb-deco-5">∫</span>

          {/* Content */}
          <div className="lb-side-content">
            <div className="lb-side-trophy-wrap">
              <span className="lb-side-trophy">🏆</span>
              <div className="lb-side-trophy-glow" />
            </div>

            <h2 className="lb-side-title">Rise to the Top</h2>
            <p className="lb-side-tagline">
              Every quiz you complete brings you one step closer to the #1 spot.
              Master all three subjects and dominate the board!
            </p>

            <div className="lb-side-divider" />

            <p className="lb-side-tips-heading">HOW TO EARN MORE STARS</p>
            <div className="lb-side-tips">
              <div className="lb-tip">
                <span className="lb-tip-icon lb-tip-gold">⭐</span>
                <div>
                  <strong>Score high</strong>
                  <span>Perfect 8/8 gives a massive bonus</span>
                </div>
              </div>
              <div className="lb-tip">
                <span className="lb-tip-icon lb-tip-fire">🔥</span>
                <div>
                  <strong>Build streaks</strong>
                  <span>3× and 5× chains multiply points</span>
                </div>
              </div>
              <div className="lb-tip">
                <span className="lb-tip-icon lb-tip-hard">⚡</span>
                <div>
                  <strong>Play Hard mode</strong>
                  <span>2× score multiplier every answer</span>
                </div>
              </div>
              <div className="lb-tip">
                <span className="lb-tip-icon lb-tip-time">⏱</span>
                <div>
                  <strong>Beat the clock</strong>
                  <span>Finish in 8 min for top rewards</span>
                </div>
              </div>
            </div>

            <div className="lb-side-subjects">
              <span className="lb-side-subject lb-subj-geo">📐 Geometry</span>
              <span className="lb-side-subject lb-subj-alg">🔢 Algebra</span>
              <span className="lb-side-subject lb-subj-num">🔣 Numbers</span>
            </div>

            <div className="lb-side-quote">
              <span className="lb-quote-mark">"</span>
              The expert in anything was once a beginner who refused to give up.
              <span className="lb-quote-mark">"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
