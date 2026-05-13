import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { quizAPI } from "../api/quizApi";
import { useUILang } from "../context/UILanguageContext";

const GRADE_CARDS = [
  { grade: 9, icon: "📐", label: "Grade 9" },
  { grade: 10, icon: "📊", label: "Grade 10" },
  { grade: 11, icon: "🔢", label: "Grade 11" },
];

const DIFF_COLORS = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };
const LESSON_COLORS = {
  Geometry: "#4361ee",
  Algebra: "#10B981",
  Numbers: "#F59E0B",
};
const STAR_COLOR = "#FBBF24";

// ── Score Trend (SVG line + area chart) ──────────────────────────────────────
const ScoreTrend = ({ sessions, tr }) => {
  const W = 440,
    H = 170;
  const PAD = { top: 16, right: 16, bottom: 36, left: 46 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;

  const sorted = [...sessions]
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .slice(-10);

  if (sorted.length < 2) {
    return (
      <div
        style={{
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          gap: "0.4rem",
        }}
      >
        <span style={{ fontSize: "2rem" }}>📉</span>
        {tr("dash_trend_empty")}
      </div>
    );
  }

  const scores = sorted.map((s) => s.totalScore || 0);
  const maxS = Math.max(...scores, 1);
  const minS = Math.min(...scores);
  const range = maxS - minS || 1;

  const xScale = (i) => PAD.left + (i / (sorted.length - 1)) * iw;
  const yScale = (v) => PAD.top + ih - ((v - minS) / range) * ih;

  const pts = scores.map((v, i) => `${xScale(i)},${yScale(v)}`).join(" ");
  const areaPath = `${PAD.left},${PAD.top + ih} ${pts} ${xScale(sorted.length - 1)},${PAD.top + ih}`;
  const yTicks = [minS, Math.round((minS + maxS) / 2), maxS];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4361ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4361ee" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={yScale(t)}
            x2={PAD.left + iw}
            y2={yScale(t)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text
            x={PAD.left - 7}
            y={yScale(t) + 4}
            textAnchor="end"
            fill="#9ca3af"
            fontSize="11"
          >
            {t}
          </text>
        </g>
      ))}
      <polygon points={areaPath} fill="url(#trendGrad)" />
      <polyline
        points={pts}
        fill="none"
        stroke="#4361ee"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {sorted.map((s, i) => (
        <g key={i}>
          <circle
            cx={xScale(i)}
            cy={yScale(scores[i])}
            r="4.5"
            fill="#fff"
            stroke="#4361ee"
            strokeWidth="2.5"
          />
          <text
            x={xScale(i)}
            y={H - 6}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="10"
          >
            {new Date(s.completedAt).toLocaleDateString("en", {
              month: "short",
              day: "numeric",
            })}
          </text>
        </g>
      ))}
    </svg>
  );
};

// ── Difficulty Donut Chart ────────────────────────────────────────────────────
const DifficultyDonut = ({ sessions, tr }) => {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  sessions.forEach((s) => {
    if (s.difficulty && counts[s.difficulty] !== undefined)
      counts[s.difficulty]++;
  });
  const total = counts.Easy + counts.Medium + counts.Hard;

  if (total === 0) {
    return (
      <div
        style={{
          height: 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          gap: "0.4rem",
        }}
      >
        <span style={{ fontSize: "2rem" }}>🎯</span>
        {tr("dash_donut_empty")}
      </div>
    );
  }

  const R = 54,
    cx = 78,
    cy = 78,
    sw = 22;
  const circum = 2 * Math.PI * R;
  let cumulative = 0;
  const segments = ["Easy", "Medium", "Hard"].map((d) => {
    const dashLen = (counts[d] / total) * circum;
    const seg = { d, dashLen, offset: cumulative, color: DIFF_COLORS[d] };
    cumulative += dashLen;
    return seg;
  });

  const avgCorrect =
    sessions.length > 0
      ? (
          sessions.reduce((s, q) => s + (q.correctCount || 0), 0) /
          sessions.length
        ).toFixed(1)
      : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      <svg viewBox="0 0 156 156" style={{ width: 130, flexShrink: 0 }}>
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={sw}
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={sw}
            strokeDasharray={`${seg.dashLen} ${circum - seg.dashLen}`}
            strokeDashoffset={circum - seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text
          x={cx}
          y={cy - 7}
          textAnchor="middle"
          fontWeight="700"
          fontSize="24"
          fill="var(--text)"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fill="#9ca3af"
        >
          {tr("dash_total_quizzes")}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {["Easy", "Medium", "Hard"].map((d) => (
          <div
            key={d}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              fontSize: "0.85rem",
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: DIFF_COLORS[d],
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600, minWidth: 52 }}>{d}</span>
            <span style={{ color: "var(--text-muted)" }}>
              {counts[d]}{" "}
              <span style={{ fontSize: "0.78rem" }}>
                ({total > 0 ? Math.round((counts[d] / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
        {avgCorrect && (
          <div
            style={{
              marginTop: "0.3rem",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border)",
              paddingTop: "0.4rem",
            }}
          >
            {tr("dash_avg_correct")}:{" "}
            <strong style={{ color: "var(--text)" }}>{avgCorrect}/8</strong>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Topic Performance (CSS horizontal bars) ──────────────────────────────────
const TopicBars = ({ byLesson, history, tr }) => {
  const lessons = ["Geometry", "Algebra", "Numbers"];
  const maxPlayed = Math.max(
    ...lessons.map((l) => byLesson?.[l]?.played || 0),
    1,
  );

  const correctByLesson = {};
  lessons.forEach((l) => {
    correctByLesson[l] = [];
  });
  (history || []).forEach((s) => {
    if (s.lesson && correctByLesson[s.lesson] !== undefined)
      correctByLesson[s.lesson].push(s.correctCount || 0);
  });

  return (
    <div style={{ width: "100%" }}>
      {lessons.map((lesson) => {
        const played = byLesson?.[lesson]?.played || 0;
        const totalStars = byLesson?.[lesson]?.stars || 0;
        const avgStars = played > 0 ? (totalStars / played).toFixed(1) : "0.0";
        const avgCorrect =
          correctByLesson[lesson].length > 0
            ? (
                correctByLesson[lesson].reduce((a, b) => a + b, 0) /
                correctByLesson[lesson].length
              ).toFixed(1)
            : "0.0";
        const barPct = (played / maxPlayed) * 100;
        const color = LESSON_COLORS[lesson];

        return (
          <div key={lesson} style={{ marginBottom: "1.25rem" }}>
            {/* Row 1: subject name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.35rem",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {lesson}
              </span>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginLeft: "0.25rem",
                }}
              >
                {played}{" "}
                {played !== 1
                  ? tr("dash_quizzes_label_pl")
                  : tr("dash_quizzes_label")}
              </span>
            </div>
            {/* Row 2: stats chips */}
            <div
              style={{
                display: "flex",
                gap: "0.6rem",
                marginBottom: "0.4rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  borderRadius: "6px",
                  padding: "0.15rem 0.55rem",
                  fontSize: "0.76rem",
                  color: "#92400e",
                  fontWeight: 600,
                }}
              >
                ⭐ <strong>{avgStars}</strong>&nbsp;avg stars
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "6px",
                  padding: "0.15rem 0.55rem",
                  fontSize: "0.76rem",
                  color: "#166534",
                  fontWeight: 600,
                }}
              >
                ✓ <strong>{avgCorrect}/8</strong>&nbsp;avg correct
              </span>
            </div>
            {/* Progress bar */}
            <div
              style={{
                background: "#e5e7eb",
                borderRadius: "999px",
                height: 9,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: played > 0 ? `${barPct}%` : "0%",
                  minWidth: played > 0 ? 8 : 0,
                  height: "100%",
                  background: `linear-gradient(90deg, ${color}bb, ${color})`,
                  borderRadius: "999px",
                  transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
          </div>
        );
      })}
      {lessons.every((l) => !byLesson?.[l]?.played) && (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            textAlign: "center",
            marginTop: "0.5rem",
          }}
        >
          {tr("dash_bars_empty")}
        </p>
      )}
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const { t } = useUILang();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          quizAPI.getStats(),
          quizAPI.getHistory(),
        ]);
        setStats(statsRes.data.stats);
        setHistory(historyRes.data.sessions);
      } catch {
        // non-fatal — show zeros
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderStars = (count) =>
    Array.from({ length: 4 }, (_, i) => (
      <span
        key={i}
        style={{
          color: i < count ? STAR_COLOR : "#d1d5db",
          fontSize: "0.9rem",
        }}
      >
        ★
      </span>
    ));

  const statChips = [
    {
      label: t("dash_total_quizzes"),
      value: stats?.totalQuizzes ?? 0,
      icon: "🎯",
    },
    { label: t("dash_total_stars"), value: stats?.totalStars ?? 0, icon: "⭐" },
    { label: t("dash_perfect"), value: stats?.perfectQuizzes ?? 0, icon: "🏆" },
    { label: t("dash_streak"), value: stats?.bestStreak ?? 0, icon: "🔥" },
  ];

  return (
    <div className="sd-page">
      {/* ── Welcome Header ───────────────────────────────────────── */}
      <div className="sd-header">
        <div className="sd-welcome-text">
          <h1>
            {t("dash_welcome")}, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p>{t("dash_subtitle")}</p>
        </div>
        <div className="sd-star-badge">
          ⭐ {loading ? "—" : (stats?.totalStars ?? 0)} {t("dash_stars_label")}
        </div>
      </div>

      {/* ── Stats Chips Bar ──────────────────────────────────────── */}
      <div className="sd-stats-bar">
        {statChips.map((chip) => (
          <div key={chip.label} className="sd-stat-chip">
            <span className="sd-stat-chip-icon">{chip.icon}</span>
            <div className="sd-stat-chip-info">
              <span className="sd-stat-chip-value">
                {loading ? "—" : chip.value}
              </span>
              <span className="sd-stat-chip-label">{chip.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main CSS Grid ────────────────────────────────────────── */}
      <div className="sd-grid">
        {/* ① TREND — cols 1-2, rows 1-2 (large teal card) */}
        <div className="sd-card sd-area-trend sd-accent-teal">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-teal">📈</div>
            <div>
              <div className="sd-card-title">{t("dash_score_trend")}</div>
              <div className="sd-card-subtitle">
                {t("dash_score_trend_sub", {
                  n: Math.min(history.length, 10),
                })}
              </div>
            </div>
          </div>
          <div className="sd-card-body">
            {loading ? (
              <div className="sd-card-loading">
                {t("dash_loading_analytics")}
              </div>
            ) : (
              <ScoreTrend sessions={history} tr={t} />
            )}
          </div>
        </div>

        {/* ② GRADES — col 3, row 1 (blue card) */}
        <div className="sd-card sd-area-grades sd-accent-blue">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-blue">🎓</div>
            <div>
              <div className="sd-card-title">{t("dash_start_quiz")}</div>
              <div className="sd-card-subtitle">Choose your grade level</div>
            </div>
          </div>
          <div className="sd-card-body">
            <div className="sd-grade-cards">
              {GRADE_CARDS.map(({ grade, icon, label }) => (
                <button
                  key={grade}
                  className="sd-grade-btn"
                  onClick={() => navigate(`/student/quiz/setup?grade=${grade}`)}
                >
                  <span className="sd-grade-btn-icon">{icon}</span>
                  <div className="sd-grade-btn-info">
                    <div className="sd-grade-btn-title">{label}</div>
                    <div className="sd-grade-btn-sub">
                      Algebra · Geometry · Numbers
                    </div>
                  </div>
                  <span className="sd-grade-btn-arrow">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ③ STAR STAT — col 4, row 1 (dark cyan card) */}
        <div className="sd-card sd-area-star sd-accent-cyan">
          <div className="sd-card-body sd-star-inner">
            <span className="sd-star-big">⭐</span>
            <div className="sd-star-count">
              {loading ? "—" : (stats?.totalStars ?? 0)}
            </div>
            <div className="sd-star-label">{t("dash_total_stars")}</div>
            {!loading && (stats?.bestStreak ?? 0) > 0 && (
              <div className="sd-star-streak">🔥 {stats.bestStreak} streak</div>
            )}
            {!loading && (stats?.perfectQuizzes ?? 0) > 0 && (
              <div
                className="sd-star-streak"
                style={{
                  background: "#fef9c3",
                  borderColor: "#fef08a",
                  color: "#854d0e",
                }}
              >
                🏆 {stats.perfectQuizzes} perfect
              </div>
            )}
          </div>
        </div>

        {/* ④ TOPIC — col 3, rows 2-3 (terracotta card) */}
        <div className="sd-card sd-area-topic sd-accent-terra">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-terra">📚</div>
            <div>
              <div className="sd-card-title">{t("dash_topic")}</div>
              <div className="sd-card-subtitle">{t("dash_topic_sub")}</div>
            </div>
          </div>
          <div className="sd-card-body">
            {loading ? (
              <div className="sd-card-loading">
                {t("dash_loading_analytics")}
              </div>
            ) : (
              <TopicBars byLesson={stats?.byLesson} history={history} tr={t} />
            )}
          </div>
        </div>

        {/* ⑤ DONUT — col 4, rows 2-3 (slate card) */}
        <div className="sd-card sd-area-donut sd-accent-slate">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-slate">🎯</div>
            <div>
              <div className="sd-card-title">{t("dash_difficulty")}</div>
              <div className="sd-card-subtitle">{t("dash_difficulty_sub")}</div>
            </div>
          </div>
          <div className="sd-card-body">
            {loading ? (
              <div className="sd-card-loading">
                {t("dash_loading_analytics")}
              </div>
            ) : (
              <DifficultyDonut sessions={history} tr={t} />
            )}
          </div>
          {!loading && (
            <div className="sd-donut-footer">
              {stats?.totalQuizzes ?? 0} total quizzes completed
            </div>
          )}
        </div>

        {/* ⑥ HISTORY — cols 1-2, row 3 (pink card) */}
        <div className="sd-card sd-area-hist sd-accent-pink">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-pink">🕐</div>
            <div>
              <div className="sd-card-title">{t("dash_recent")}</div>
              <div className="sd-card-subtitle">Your last 5 quiz sessions</div>
            </div>
          </div>
          <div className="sd-card-body sd-hist-body">
            {loading ? (
              <div className="sd-card-loading">
                {t("dash_loading_analytics")}
              </div>
            ) : history.length === 0 ? (
              <div className="sd-empty">{t("dash_no_history")}</div>
            ) : (
              history.slice(0, 5).map((s) => (
                <div key={s._id} className="sd-hist-row">
                  <div className="sd-hist-left">
                    <span
                      className="sd-hist-diff-badge"
                      style={{
                        background: DIFF_COLORS[s.difficulty] + "22",
                        color: DIFF_COLORS[s.difficulty],
                      }}
                    >
                      {s.difficulty}
                    </span>
                    <span className="sd-hist-lesson">{s.lesson}</span>
                    <span className="sd-hist-grade">Gr.{s.grade}</span>
                  </div>
                  <div className="sd-hist-right">
                    <span className="sd-hist-score">{s.totalScore} pts</span>
                    <span>{renderStars(s.starsEarned)}</span>
                    <span className="sd-hist-date">
                      {new Date(s.completedAt).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
