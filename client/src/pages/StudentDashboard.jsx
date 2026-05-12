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
    <div>
      {lessons.map((lesson) => {
        const played = byLesson?.[lesson]?.played || 0;
        const totalStars = byLesson?.[lesson]?.stars || 0;
        const avgStars = played > 0 ? (totalStars / played).toFixed(1) : null;
        const avgCorrect =
          correctByLesson[lesson].length > 0
            ? (
                correctByLesson[lesson].reduce((a, b) => a + b, 0) /
                correctByLesson[lesson].length
              ).toFixed(1)
            : null;
        const barPct = (played / maxPlayed) * 100;
        const color = LESSON_COLORS[lesson];

        return (
          <div key={lesson} style={{ marginBottom: "1.1rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.3rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {lesson}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>
                  {played}{" "}
                  {played !== 1
                    ? tr("dash_quizzes_label_pl")
                    : tr("dash_quizzes_label")}
                </span>
                {avgStars && (
                  <span>
                    ⭐{" "}
                    <strong style={{ color: "var(--text)" }}>{avgStars}</strong>{" "}
                    {tr("dash_avg_stars")}
                  </span>
                )}
                {avgCorrect && (
                  <span>
                    ✅{" "}
                    <strong style={{ color: "var(--text)" }}>
                      {avgCorrect}/8
                    </strong>{" "}
                    {tr("dash_avg_correct_label")}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                background: "#e5e7eb",
                borderRadius: "999px",
                height: 11,
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
        style={{ color: i < count ? STAR_COLOR : "#d1d5db", fontSize: "1rem" }}
      >
        ★
      </span>
    ));

  return (
    <div className="page-container">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 className="page-title">
            {t("dash_welcome")}, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="page-subtitle">{t("dash_subtitle")}</p>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            color: "#fff",
            padding: "0.6rem 1.2rem",
            borderRadius: "24px",
            fontWeight: 700,
            fontSize: "1.1rem",
            boxShadow: "0 2px 8px rgba(251,191,36,0.4)",
          }}
        >
          ⭐ {loading ? "—" : (stats?.totalStars ?? 0)} {t("dash_stars_label")}
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: t("dash_total_quizzes"),
            value: stats?.totalQuizzes ?? 0,
            icon: "🎯",
          },
          {
            label: t("dash_total_stars"),
            value: stats?.totalStars ?? 0,
            icon: "⭐",
          },
          {
            label: t("dash_perfect"),
            value: stats?.perfectQuizzes ?? 0,
            icon: "🏆",
          },
          {
            label: t("dash_streak"),
            value: stats?.bestStreak ?? 0,
            icon: "🔥",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="card"
            style={{ textAlign: "center", padding: "1.2rem" }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>
              {card.icon}
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              {loading ? "—" : card.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Performance Analytics ── */}
      <h2 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: 700 }}>
        {t("dash_analytics")}
      </h2>

      {loading ? (
        <div
          className="card"
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-muted)",
            marginBottom: "2rem",
          }}
        >
          {t("dash_loading_analytics")}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  marginBottom: "0.25rem",
                }}
              >
                {t("dash_score_trend")}
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  marginBottom: "0.9rem",
                }}
              >
                {t("dash_score_trend_sub", { n: Math.min(history.length, 10) })}
              </p>
              <ScoreTrend sessions={history} tr={t} />
            </div>
            <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  marginBottom: "0.25rem",
                }}
              >
                {t("dash_difficulty")}
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  marginBottom: "0.9rem",
                }}
              >
                {t("dash_difficulty_sub")}
              </p>
              <DifficultyDonut sessions={history} tr={t} />
            </div>
          </div>
          <div
            className="card"
            style={{ padding: "1.2rem 1.4rem", marginBottom: "2rem" }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                marginBottom: "0.25rem",
              }}
            >
              {t("dash_topic")}
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.78rem",
                marginBottom: "1.1rem",
              }}
            >
              {t("dash_topic_sub")}
            </p>
            <TopicBars byLesson={stats?.byLesson} history={history} tr={t} />
          </div>
        </>
      )}

      {/* Grade cards */}
      <h2 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: 700 }}>
        {t("dash_start_quiz")}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.2rem",
          marginBottom: "2.5rem",
        }}
      >
        {GRADE_CARDS.map(({ grade, icon, label }) => (
          <div
            key={grade}
            className="card"
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              cursor: "default",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(67,97,238,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
              {icon}
            </div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              {label}
            </h3>
            <button
              className="btn btn-primary"
              style={{ width: "auto", padding: "0.6rem 1.8rem" }}
              onClick={() => navigate(`/student/quiz/setup?grade=${grade}`)}
            >
              {t("dash_start_btn")}
            </button>
          </div>
        ))}
      </div>

      {/* Recent History */}
      <h2 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: 700 }}>
        {t("dash_recent")}
      </h2>
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>
          {t("dash_loading_analytics")}
        </p>
      ) : history.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--text-muted)",
          }}
        >
          {t("dash_no_history")}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {history.slice(0, 5).map((s, i) => (
            <div
              key={s._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.9rem 1.4rem",
                borderBottom:
                  i < Math.min(history.length, 5) - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div
                style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}
              >
                <span
                  style={{
                    background: DIFF_COLORS[s.difficulty] + "20",
                    color: DIFF_COLORS[s.difficulty],
                    padding: "0.2rem 0.6rem",
                    borderRadius: "12px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                >
                  {s.difficulty}
                </span>
                <span style={{ fontWeight: 600 }}>{s.lesson}</span>
                <span
                  style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                >
                  Grade {s.grade}
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}
              >
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                  {s.totalScore} pts
                </span>
                <span>{renderStars(s.starsEarned)}</span>
                <span
                  style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                >
                  {new Date(s.completedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
