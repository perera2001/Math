import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizAPI } from "../api/quizApi";
import { useUILang } from "../context/UILanguageContext";

const STAR_COLOR = "#FBBF24";
const STAR_EMPTY = "#d1d5db";
const LABELS = ["A", "B", "C", "D"];

const resolveText = (val, lang = "en") => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] || val.en || "";
};

// Render **bold** markers and newlines as React elements
const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split(/\n/).flatMap((line, lineIdx, lines) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g).map((seg, segIdx) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={`${lineIdx}-${segIdx}`}>{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });
    return lineIdx < lines.length - 1
      ? [...segments, <br key={`br-${lineIdx}`} />]
      : segments;
  });
};

/* Simple CSS confetti — 20 coloured spans positioned absolutely */
const Confetti = () => {
  const colours = [
    "#FBBF24",
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
      {Array.from({ length: 28 }).map((_, i) => (
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
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const QuizResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useUILang();
  const [result, setResult] = useState(null);
  const [visibleStars, setVisibleStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explainLoading, setExplainLoading] = useState({});
  const [explainError, setExplainError] = useState({});
  const [explanationLanguage, setExplanationLanguage] = useState("en");
  const animRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await quizAPI.getResult(sessionId);
        setResult(res.data);
        setGrade(res.data.grade);
      } catch {
        // Fallback: older backend versions may only support history summary.
        try {
          const historyRes = await quizAPI.getHistory();
          const session = historyRes.data.sessions.find(
            (s) => s._id === sessionId,
          );
          if (session) {
            setResult(session);
            setGrade(session.grade);
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  // Animate star reveal
  useEffect(() => {
    if (!result) return;
    let count = 0;
    animRef.current = setInterval(() => {
      count += 1;
      setVisibleStars(count);
      if (count >= result.starsEarned) clearInterval(animRef.current);
    }, 350);
    return () => clearInterval(animRef.current);
  }, [result]);

  const fmt = (secs) => {
    if (!secs && secs !== 0) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loading) return <div className="page-loading">{t('results_loading')}</div>;

  if (!result) {
    return (
      <div className="page-container" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>{t('results_not_found')}</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: "1rem", width: "auto" }}
          onClick={() => navigate("/student/dashboard")}
        >
          {t('results_back_dashboard')}
        </button>
      </div>
    );
  }

  const correctCount = result.correctCount ?? "—";

  const lifelinesCount = result.lifelinesUsed
    ? Object.values(result.lifelinesUsed).filter(Boolean).length
    : 0;

  const showConfetti = result.starsEarned >= 3;
  const language = result.language || "en";

  const perQuestion = Array.isArray(result.perQuestion)
    ? result.perQuestion
    : [];

  const fetchExplanation = async (questionIndex) => {
    setExplainLoading((prev) => ({ ...prev, [questionIndex]: true }));
    setExplainError((prev) => ({ ...prev, [questionIndex]: "" }));

    try {
      const res = await quizAPI.explainAnswer({
        sessionId,
        questionIndex,
        language: explanationLanguage,
      });

      setExplanations((prev) => ({
        ...prev,
        [questionIndex]: res.data.explanation,
      }));
    } catch (err) {
      setExplainError((prev) => ({
        ...prev,
        [questionIndex]:
          err.response?.data?.message || "Failed to generate explanation.",
      }));
    } finally {
      setExplainLoading((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "1.5rem",
        position: "relative",
      }}
    >
      {showConfetti && <Confetti />}

      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "2.5rem 2rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Stars */}
        <div style={{ marginBottom: "1rem" }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              style={{
                fontSize: "2.8rem",
                color: i < visibleStars ? STAR_COLOR : STAR_EMPTY,
                transition: "color 0.3s",
                filter:
                  i < visibleStars ? "drop-shadow(0 0 6px #fbbf24aa)" : "none",
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: "3.5rem",
            fontWeight: 900,
            color: "var(--primary)",
            lineHeight: 1,
            marginBottom: "0.4rem",
          }}
        >
          {result.totalScore ?? 0}
        </div>
        <div style={{ color: "var(--text-muted)", marginBottom: "1.8rem" }}>
          {t('results_points')}
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.8rem",
            marginBottom: "2rem",
          }}
        >
          {[
            { label: t('results_correct_stat'), value: `${correctCount}/8`, icon: "✅" },
            {
              label: t('results_time_stat'),
              value: fmt(result.timeSpentTotal),
              icon: "⏱",
            },
            { label: t('results_streak_stat'), value: result.maxStreak ?? 0, icon: "🔥" },
            { label: t('results_lifelines_stat'), value: lifelinesCount, icon: "🛠" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--bg)",
                borderRadius: "10px",
                padding: "0.8rem 0.5rem",
              }}
            >
              <div style={{ fontSize: "1.4rem" }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div
          style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}
        >
          <button
            className="btn btn-primary"
            style={{ width: "auto", padding: "0.7rem 1.6rem" }}
            onClick={() => navigate(`/student/quiz/setup?grade=${grade || 9}`)}
          >
            {t('results_play_again')}
          </button>
          <button
            className="btn"
            style={{
              width: "auto",
              padding: "0.7rem 1.6rem",
              background: "var(--bg)",
              color: "var(--text)",
              border: "2px solid var(--border)",
            }}
            onClick={() => navigate("/student/dashboard")}
          >
            {t('results_dashboard')}
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{ marginTop: "1.2rem", padding: "1.2rem 1.1rem" }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
            {t('results_answer_review')}
          </h3>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            {t('results_review_sub')}
          </p>

          {/* Explanation Language Selector */}
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
              {t('results_explain_lang')}
            </span>
            {["en", "si", "ta"].map((lang) => {
              const labels = { en: "English", si: "සිංහල", ta: "தமிழ்" };
              return (
                <button
                  key={lang}
                  onClick={() => setExplanationLanguage(lang)}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
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
                    transition: "all 0.2s",
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
            {t('results_no_review')}
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
                  ? t('results_not_answered')
                  : resolveText(q.options[selectedIdx], language);
              const correctText = resolveText(q.options[correctIdx], language);

              return (
                <div
                  key={q.questionIndex}
                  style={{
                    border: `1px solid ${q.isCorrect ? "#bbf7d0" : "#fecaca"}`,
                    borderLeft: `4px solid ${q.isCorrect ? "#10B981" : "#EF4444"}`,
                    borderRadius: "12px",
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
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: q.isCorrect ? "#dcfce7" : "#fee2e2",
                        color: q.isCorrect ? "#166534" : "#991b1b",
                      }}
                    >
                      {q.isCorrect ? t('results_correct_badge') : t('results_wrong_badge')}
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
                      const text = resolveText(opt, language);
                      const isSelected = idx === selectedIdx;
                      const isCorrect = idx === correctIdx;

                      let borderColor = "var(--border)";
                      let background = "#fff";
                      if (isCorrect) {
                        borderColor = "#10B981";
                        background = "#ecfdf5";
                      } else if (isSelected && !q.isCorrect) {
                        borderColor = "#EF4444";
                        background = "#fee2e2";
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            border: `1px solid ${borderColor}`,
                            background,
                            borderRadius: "10px",
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
                            style={{ fontSize: "0.76rem", fontWeight: 700 }}
                          >
                            {isCorrect
                              ? t('results_correct_label')
                              : isSelected
                                ? t('results_your_answer_label')
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
                    {t('results_your_answer')}:{" "}
                    <strong style={{ color: "var(--text)" }}>
                      {selectedText}
                    </strong>
                    {!q.isCorrect && (
                      <>
                        {" "}
                        | {t('results_correct_answer')}:{" "}
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
                      ? t('results_explain_loading')
                      : t('results_explain_btn')}
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
                        borderRadius: "10px",
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
    </div>
  );
};

export default QuizResults;
