import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizAPI } from "../api/quizApi";
import { useUILang } from "../context/UILanguageContext";
import RankBadge, {
  getRankLabel,
  getStarsPerTier,
  LEGENDARY_SAGE_INDEX,
  RANK_ACCENT,
} from "../components/RankBadge";

const LABELS = ["A", "B", "C", "D"];

const resolveText = (val, lang = "en") => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] || val.en || "";
};

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split(/\n/).flatMap((line, lineIdx, lines) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g).map((seg, segIdx) => {
      if (seg.startsWith("**") && seg.endsWith("**"))
        return <strong key={`${lineIdx}-${segIdx}`}>{seg.slice(2, -2)}</strong>;
      return seg;
    });
    return lineIdx < lines.length - 1
      ? [...segments, <br key={`br-${lineIdx}`} />]
      : segments;
  });
};

const fmt = (secs) => {
  if (!secs && secs !== 0) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const OUTCOME_CONFIG = {
  Flawless: {
    color: "#fbbf24",
    bg: "linear-gradient(135deg,#78350f 0%,#92400e 50%,#b45309 100%)",
    glow: "#fbbf2488",
    emoji: "🌟",
    keyEn: "outcome_flawless",
    stars: "+2",
  },
  Victory: {
    color: "#60a5fa",
    bg: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 100%)",
    glow: "#60a5fa88",
    emoji: "✅",
    keyEn: "outcome_victory",
    stars: "+1",
  },
  Draw: {
    color: "#94a3b8",
    bg: "linear-gradient(135deg,#1e293b 0%,#334155 50%,#475569 100%)",
    glow: "#94a3b855",
    emoji: "🤝",
    keyEn: "outcome_draw",
    stars: "±0",
  },
  Defeat: {
    color: "#f87171",
    bg: "linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#b91c1c 100%)",
    glow: "#f8717188",
    emoji: "❌",
    keyEn: "outcome_defeat",
    stars: "−1",
  },
};

const Confetti = () => {
  const colours = [
    "#fbbf24",
    "#10B981",
    "#4361ee",
    "#EF4444",
    "#a78bfa",
    "#f472b6",
  ];
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {Array.from({ length: 32 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: `${Math.random() * 40}%`,
            left: `${Math.random() * 100}%`,
            width: 10,
            height: 10,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: colours[i % colours.length],
            animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards`,
          }}
        />
      ))}
      <style>{`@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
};

const AnimatedStarPips = ({
  total,
  filled,
  accent,
  animatedIndex,
  size = 14,
}) => (
  <div
    style={{
      display: "flex",
      gap: 4,
      justifyContent: "center",
      flexWrap: "wrap",
    }}
  >
    {Array.from({ length: total }, (_, i) => {
      const isFilled = i < filled;
      const isNew = i === animatedIndex;
      return (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: isFilled ? accent : "rgba(148,163,184,0.25)",
            border: `1.5px solid ${isFilled ? accent : "rgba(148,163,184,0.4)"}`,
            boxShadow: isFilled ? `0 0 6px ${accent}` : "none",
            transform: isNew ? "scale(1.35)" : "scale(1)",
            transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      );
    })}
  </div>
);

const RankChangeModal = ({ gameResult, onClose }) => {
  if (!gameResult?.rankChanged) return null;
  const { promoted, prevRank, newRank } = gameResult;
  const bg = promoted
    ? "linear-gradient(135deg,#064e3b 0%,#065f46 100%)"
    : "linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)";
  const title = promoted ? "🎉 RANK UP!" : "📉 RANK DOWN";
  const col = promoted ? "#34d399" : "#f87171";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        style={{
          background: bg,
          borderRadius: 20,
          padding: "2.5rem 3rem",
          textAlign: "center",
          maxWidth: 340,
          border: `2px solid ${col}`,
          boxShadow: `0 0 40px ${col}88`,
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
          {promoted ? "🏆" : "😞"}
        </div>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 900,
            color: col,
            letterSpacing: 2,
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: "0.9rem",
            marginBottom: "0.25rem",
          }}
        >
          From
        </div>
        <div
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: "0.25rem",
          }}
        >
          {prevRank}
        </div>
        <div style={{ fontSize: "1.5rem", color: col }}>↓</div>
        <div
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            color: col,
            marginBottom: "1.5rem",
          }}
        >
          {newRank}
        </div>
        <button
          onClick={onClose}
          style={{
            background: col,
            color: "#0f172a",
            border: "none",
            borderRadius: 10,
            padding: "0.7rem 2rem",
            fontWeight: 800,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
};

const QuizResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useUILang();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explainLoading, setExplainLoading] = useState({});
  const [explainError, setExplainError] = useState({});
  const [explanationLanguage, setExplanationLanguage] = useState("en");
  const [displayedStars, setDisplayedStars] = useState(0);
  const [showRankModal, setShowRankModal] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await quizAPI.getResult(sessionId);
        setResult(res.data);
        setGrade(res.data.grade);
        setExplanationLanguage(res.data.language || "en");
      } catch {
        try {
          const h = await quizAPI.getHistory();
          const s = h.data.sessions?.find((x) => x._id === sessionId);
          if (s) {
            setResult(s);
            setGrade(s.grade);
          }
        } catch {
          /* ignore */
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  useEffect(() => {
    if (!result) return;
    const rr = result.rankResult;
    if (!rr) {
      setDisplayedStars(0);
      return;
    }
    const target = rr.rankStarsAfter ?? 0;
    const start = rr.rankStarsBefore ?? 0;
    setDisplayedStars(start);
    if (start === target) {
      if (rr.rankChanged) setTimeout(() => setShowRankModal(true), 600);
      return;
    }
    const step = target > start ? 1 : -1;
    let cur = start;
    animRef.current = setInterval(() => {
      cur += step;
      setDisplayedStars(cur);
      if (cur === target) {
        clearInterval(animRef.current);
        if (rr.rankChanged) setTimeout(() => setShowRankModal(true), 600);
      }
    }, 400);
    return () => clearInterval(animRef.current);
  }, [result]);

  if (loading)
    return (
      <div
        className="page-loading"
        style={{ color: "#94a3b8", padding: "3rem", textAlign: "center" }}
      >
        {t("results_loading")}
      </div>
    );
  if (!result)
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", padding: "3rem" }}
      >
        <p style={{ color: "var(--text-muted)" }}>{t("results_not_found")}</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: "1rem", width: "auto" }}
          onClick={() => navigate("/student/dashboard")}
        >
          {t("results_back_dashboard")}
        </button>
      </div>
    );

  const language = result.language || "en";
  const rr = result.rankResult;
  const outcome = rr?.outcome ?? "Draw";
  const ocfg = OUTCOME_CONFIG[outcome] ?? OUTCOME_CONFIG.Draw;
  const correctCount = result.correctCount ?? 0;
  const accuracy = Math.round((correctCount / 8) * 100);
  const newRankIdx = rr ? (result.newRankState?.rankIndex ?? 0) : 0;
  const newTier = rr ? (result.newRankState?.tier ?? 3) : 3;
  const accentColor =
    RANK_ACCENT[Math.min(newRankIdx, LEGENDARY_SAGE_INDEX)] ?? "#22c55e";
  const spt = getStarsPerTier(newRankIdx);
  const showConfetti = outcome === "Flawless" || outcome === "Victory";
  const perQuestion = Array.isArray(result.perQuestion)
    ? result.perQuestion
    : [];

  const fetchExplanation = async (qIdx) => {
    setExplainLoading((p) => ({ ...p, [qIdx]: true }));
    setExplainError((p) => ({ ...p, [qIdx]: "" }));
    try {
      const res = await quizAPI.explainAnswer({
        sessionId,
        questionIndex: qIdx,
        language: explanationLanguage,
      });
      setExplanations((p) => ({ ...p, [qIdx]: res.data.explanation }));
    } catch (err) {
      setExplainError((p) => ({
        ...p,
        [qIdx]:
          err.response?.data?.message || "Failed to generate explanation.",
      }));
    } finally {
      setExplainLoading((p) => ({ ...p, [qIdx]: false }));
    }
  };

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "1.5rem",
        position: "relative",
        minHeight: "100vh",
      }}
    >
      {showConfetti && <Confetti />}
      {showRankModal && rr && (
        <RankChangeModal
          gameResult={rr}
          onClose={() => setShowRankModal(false)}
        />
      )}

      {/* ── OUTCOME BANNER ── */}
      <div
        style={{
          background: ocfg.bg,
          borderRadius: 18,
          padding: "2rem 1.5rem 1.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          marginBottom: "1.2rem",
          boxShadow: `0 0 32px ${ocfg.glow}`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(circle at 50% 0%,${ocfg.color}22 0%,transparent 70%)`,
          }}
        />
        <div
          style={{
            fontSize: "clamp(2rem,6vw,3.5rem)",
            fontWeight: 900,
            color: ocfg.color,
            letterSpacing: 4,
            textShadow: `0 0 24px ${ocfg.glow}`,
            marginBottom: "0.3rem",
            position: "relative",
            animation: "fadeSlideDown 0.5s ease",
          }}
        >
          {ocfg.emoji} {t(ocfg.keyEn).toUpperCase()}
        </div>

        {(rr?.bonusBoosted || rr?.protectionUsed) && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
              marginBottom: "0.8rem",
            }}
          >
            {rr.bonusBoosted && (
              <span
                style={{
                  background: "#78350f",
                  color: "#fde68a",
                  border: "1px solid #fbbf24",
                  borderRadius: 99,
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                💎 BONUS BOOSTED!
              </span>
            )}
            {rr.protectionUsed && (
              <span
                style={{
                  background: "#1e3a8a",
                  color: "#bfdbfe",
                  border: "1px solid #3b82f6",
                  borderRadius: 99,
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                🛡️ PROTECTED!
              </span>
            )}
          </div>
        )}

        <div
          style={{
            fontSize: "3rem",
            fontWeight: 900,
            color: "#f1f5f9",
            lineHeight: 1,
            marginBottom: "0.2rem",
          }}
        >
          {result.totalScore ?? 0}
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: "0.85rem",
            marginBottom: "1.2rem",
          }}
        >
          {t("results_points")}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "0.7rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            {
              icon: "✅",
              label: t("results_correct_stat"),
              value: `${correctCount}/8`,
            },
            { icon: "🎯", label: "Accuracy", value: `${accuracy}%` },
            {
              icon: "⏱",
              label: t("results_time_stat"),
              value: fmt(result.timeSpentTotal),
            },
            {
              icon: "🔥",
              label: t("results_streak_stat"),
              value: result.maxStreak ?? 0,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "0.75rem 0.4rem",
                backdropFilter: "blur(4px)",
              }}
            >
              <div style={{ fontSize: "1.3rem" }}>{s.icon}</div>
              <div
                style={{ fontWeight: 800, color: "#f1f5f9", fontSize: "1rem" }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {rr && (
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 14,
              padding: "1rem",
              margin: "0 auto",
              maxWidth: 340,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.7rem",
              }}
            >
              <RankBadge
                rankIndex={newRankIdx}
                tier={newTier}
                starsInTier={displayedStars}
                size="md"
                showPips={false}
              />
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: accentColor,
                    fontSize: "0.9rem",
                  }}
                >
                  {getRankLabel(newRankIdx, newTier)}
                </div>
                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                  {displayedStars}/{spt} stars
                </div>
              </div>
            </div>
            <AnimatedStarPips
              total={spt}
              filled={displayedStars}
              accent={accentColor}
              animatedIndex={
                rr.rankStarsBefore < rr.rankStarsAfter
                  ? rr.rankStarsBefore
                  : rr.rankStarsBefore - 1
              }
              size={14}
            />
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                marginTop: "0.9rem",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>
                +{rr.xpAwarded ?? 0} XP
              </span>
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                +{rr.coinsAwarded ?? 0} 🪙
              </span>
              <span style={{ color: ocfg.color, fontWeight: 700 }}>
                {ocfg.stars} ⭐
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            marginTop: "1.2rem",
          }}
        >
          <button
            className="btn btn-primary"
            style={{
              width: "auto",
              padding: "0.75rem 1.8rem",
              fontWeight: 700,
            }}
            onClick={() => navigate(`/student/quiz/setup?grade=${grade || 9}`)}
          >
            {t("results_play_again")}
          </button>
          <button
            style={{
              width: "auto",
              padding: "0.75rem 1.8rem",
              background: "rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => navigate("/student/dashboard")}
          >
            {t("results_dashboard")}
          </button>
          <button
            style={{
              width: "auto",
              padding: "0.75rem 1.8rem",
              background: "rgba(255,255,255,0.08)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={() => navigate("/student/profile")}
          >
            👤 My Rank
          </button>
        </div>
      </div>

      {/* ── ANSWER REVIEW ── */}
      <div
        className="card"
        style={{ padding: "1.2rem 1.1rem", zIndex: 1, position: "relative" }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
            {t("results_answer_review")}
          </h3>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            {t("results_review_sub")}
          </p>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.6rem",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-muted)",
              }}
            >
              {t("results_explain_lang")}
            </span>
            {["en", "si", "ta"].map((lang) => {
              const labels = { en: "English", si: "සිංහල", ta: "தமிழ்" };
              return (
                <button
                  key={lang}
                  onClick={() => setExplanationLanguage(lang)}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: 6,
                    border:
                      explanationLanguage === lang
                        ? "2px solid var(--primary)"
                        : "1px solid var(--border)",
                    background:
                      explanationLanguage === lang
                        ? "var(--primary)"
                        : "var(--bg)",
                    color:
                      explanationLanguage === lang ? "#fff" : "var(--text)",
                    fontWeight: explanationLanguage === lang ? 700 : 500,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {perQuestion.length === 0 ? (
          <div style={{ color: "var(--text-muted)", padding: "0.5rem 0" }}>
            {t("results_no_review")}
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
          >
            {perQuestion.map((q) => {
              const questionText = resolveText(q.questionText, language);
              const selectedIdx = q.userAnswerIndex;
              const correctIdx = q.correctAnswerIndex;
              const selectedText =
                selectedIdx === null || selectedIdx === undefined
                  ? t("results_not_answered")
                  : resolveText(q.options[selectedIdx], language);
              const correctText = resolveText(q.options[correctIdx], language);
              return (
                <div
                  key={q.questionIndex}
                  style={{
                    border: `1px solid ${q.isCorrect ? "#bbf7d0" : "#fecaca"}`,
                    borderLeft: `4px solid ${q.isCorrect ? "#10B981" : "#EF4444"}`,
                    borderRadius: 12,
                    padding: "0.95rem",
                    background: q.isCorrect ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.8rem",
                      marginBottom: "0.7rem",
                    }}
                  >
                    <div style={{ fontWeight: 700, lineHeight: 1.45 }}>
                      Q{q.questionIndex + 1}. {questionText}
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        alignSelf: "flex-start",
                        padding: "0.2rem 0.5rem",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: q.isCorrect ? "#dcfce7" : "#fee2e2",
                        color: q.isCorrect ? "#166534" : "#991b1b",
                      }}
                    >
                      {q.isCorrect
                        ? t("results_correct_badge")
                        : t("results_wrong_badge")}
                      {q.attemptCount > 1 && (
                        <span style={{ marginLeft: "0.3rem", opacity: 0.7 }}>
                          ({q.attemptCount} tries)
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: "0.45rem",
                      marginBottom: "0.7rem",
                    }}
                  >
                    {(q.options || []).map((opt, idx) => {
                      const text = resolveText(opt, language),
                        isSelected = idx === selectedIdx,
                        isRight = idx === correctIdx;
                      return (
                        <div
                          key={idx}
                          style={{
                            border: `1px solid ${isRight ? "#10B981" : isSelected && !q.isCorrect ? "#EF4444" : "var(--border)"}`,
                            background: isRight
                              ? "#ecfdf5"
                              : isSelected && !q.isCorrect
                                ? "#fee2e2"
                                : "#fff",
                            borderRadius: 10,
                            padding: "0.55rem 0.65rem",
                            fontSize: "0.9rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "0.7rem",
                          }}
                        >
                          <span>
                            <strong style={{ marginRight: "0.3rem" }}>
                              {LABELS[idx]}.
                            </strong>
                            {text}
                          </span>
                          <span
                            style={{
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              color: "#6b7280",
                            }}
                          >
                            {isRight
                              ? t("results_correct_label")
                              : isSelected
                                ? t("results_your_answer_label")
                                : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.65rem",
                    }}
                  >
                    {t("results_your_answer")}:{" "}
                    <strong style={{ color: "var(--text)" }}>
                      {selectedText}
                    </strong>
                    {!q.isCorrect && (
                      <>
                        {" "}
                        | {t("results_correct_answer")}:{" "}
                        <strong style={{ color: "#166534" }}>
                          {correctText}
                        </strong>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{
                      width: "auto",
                      padding: "0.55rem 0.95rem",
                      fontSize: "0.85rem",
                    }}
                    onClick={() => fetchExplanation(q.questionIndex)}
                    disabled={!!explainLoading[q.questionIndex]}
                  >
                    {explainLoading[q.questionIndex]
                      ? t("results_explain_loading")
                      : t("results_explain_btn")}
                  </button>
                  {explainError[q.questionIndex] && (
                    <div
                      style={{
                        marginTop: "0.55rem",
                        color: "#b91c1c",
                        fontSize: "0.85rem",
                      }}
                    >
                      {explainError[q.questionIndex]}
                    </div>
                  )}
                  {explanations[q.questionIndex] && (
                    <div
                      style={{
                        marginTop: "0.55rem",
                        borderRadius: 10,
                        border: "1px solid #bfdbfe",
                        background: "#eff6ff",
                        padding: "0.7rem 0.8rem",
                        fontSize: "0.9rem",
                        lineHeight: 1.55,
                      }}
                    >
                      {renderMarkdown(explanations[q.questionIndex])}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:600px){.res-stat-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
      `}</style>
    </div>
  );
};

export default QuizResults;
