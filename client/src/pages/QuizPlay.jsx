import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizAPI } from "../api/quizApi";
import { useQuiz } from "../context/QuizContext";
import { useAuth } from "../context/AuthContext";
import { useUILang } from "../context/UILanguageContext";
import GameProgressBar from "../components/GameProgressBar";
import RankBadge, {
  getRankLabel,
  getStarsPerTier,
  RANK_ACCENT,
  LEGENDARY_SAGE_INDEX,
} from "../components/RankBadge";

const LABELS = ["A", "B", "C", "D"];

const fmt = (secs) => {
  const m = Math.floor(Math.abs(secs) / 60)
    .toString()
    .padStart(2, "0");
  const s = (Math.abs(secs) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const QuizPlay = () => {
  const { sessionId: paramId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useUILang();
  const {
    sessionId,
    questions,
    currentIndex,
    score,
    streak,
    timeMode,
    lesson,
    elapsedRef,
    recordAnswer,
    advanceIndex,
  } = useQuiz();

  useEffect(() => {
    if (!sessionId || sessionId.toString() !== paramId) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [sessionId, paramId, navigate]);

  /* â”€â”€ Timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [timeLeft, setTimeLeft] = useState(() => {
    if (timeMode === "8min") return 480;
    if (timeMode === "16min") return 960;
    return 0;
  });

  /* â”€â”€ Per-question state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  // Each entry: { attempts, wrongIndices, resolved, correct, finalAnswer }
  const [questionStates, setQuestionStates] = useState([]);
  const [advancing, setAdvancing] = useState(false);
  const [floatingXP, setFloatingXP] = useState(null); // { score, key }

  // Rank state loaded at game start for HUD display
  const [rankStats, setRankStats] = useState(null);

  const timerRef = useRef(null);
  const completingRef = useRef(false);
  const [completing, setCompleting] = useState(false);

  /* Load player rank stats once at game start */
  useEffect(() => {
    quizAPI
      .getStats()
      .then((res) => {
        setRankStats(res.data?.stats ?? res.data ?? null);
      })
      .catch(() => {
        /* non-blocking */
      });
  }, []);

  /* Initialise question states when questions arrive */
  useEffect(() => {
    if (questions.length > 0) {
      setQuestionStates(
        questions.map(() => ({
          attempts: 0,
          wrongIndices: [],
          resolved: false,
          correct: false,
          finalAnswer: null,
        })),
      );
    }
  }, [questions.length]);

  /* â”€â”€ Complete quiz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const triggerComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    clearInterval(timerRef.current);
    setCompleting(true);
    try {
      await quizAPI.complete({
        sessionId: paramId,
        timeSpentTotal: elapsedRef.current,
      });
      navigate(`/student/quiz/results/${paramId}`, { replace: true });
    } catch {
      navigate(`/student/quiz/results/${paramId}`, { replace: true });
    }
  }, [paramId, elapsedRef, navigate]);

  /* â”€â”€ Timer effect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleTimeUp = useCallback(() => {
    triggerComplete();
  }, [triggerComplete]);

  useEffect(() => {
    if (!sessionId) return;
    timerRef.current = setInterval(() => {
      if (timeMode === "unlimited") {
        elapsedRef.current += 1;
        setTimeLeft((t) => t + 1);
      } else {
        setTimeLeft((t) => {
          const next = t - 1;
          elapsedRef.current += 1;
          if (next <= 0) {
            clearInterval(timerRef.current);
            handleTimeUp();
          }
          return Math.max(next, 0);
        });
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [sessionId, timeMode, handleTimeUp, elapsedRef]);

  /* Warn before leaving */
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  /* â”€â”€ Answer selection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleSelect = useCallback(
    async (idx) => {
      if (completing || advancing) return;
      const state = questionStates[currentIndex];
      if (!state || state.resolved) return;
      if (state.wrongIndices.includes(idx)) return; // already tried this option

      try {
        const res = await quizAPI.answer({
          sessionId: paramId,
          questionIndex: currentIndex,
          answerIndex: idx,
          timeSpent: 0,
        });
        const { isCorrect, currentScore: newScore } = res.data;
        const xpGained = Math.max(0, newScore - score);
        recordAnswer(res.data);

        const newAttempts = state.attempts + 1;

        if (isCorrect) {
          /* Correct â€” animate gold, float XP, then advance */
          setQuestionStates((prev) => {
            const updated = [...prev];
            updated[currentIndex] = {
              ...state,
              attempts: newAttempts,
              resolved: true,
              correct: true,
              finalAnswer: idx,
            };
            return updated;
          });
          setFloatingXP({ xp: xpGained, key: Date.now() });
          setAdvancing(true);
          setTimeout(() => {
            setAdvancing(false);
            setFloatingXP(null);
            if (currentIndex < questions.length - 1) {
              advanceIndex(currentIndex + 1);
            } else {
              triggerComplete();
            }
          }, 1200);
        } else if (newAttempts === 1) {
          /* First wrong attempt â€” mark disabled, show try-again hint */
          setQuestionStates((prev) => {
            const updated = [...prev];
            updated[currentIndex] = {
              ...state,
              attempts: 1,
              wrongIndices: [...state.wrongIndices, idx],
            };
            return updated;
          });
        } else {
          /* Second wrong attempt â€” resolve and auto-advance */
          setQuestionStates((prev) => {
            const updated = [...prev];
            updated[currentIndex] = {
              ...state,
              attempts: 2,
              wrongIndices: [...state.wrongIndices, idx],
              resolved: true,
              correct: false,
              finalAnswer: idx,
            };
            return updated;
          });
          setAdvancing(true);
          setTimeout(() => {
            setAdvancing(false);
            if (currentIndex < questions.length - 1) {
              advanceIndex(currentIndex + 1);
            } else {
              triggerComplete();
            }
          }, 1200);
        }
      } catch {
        /* silently ignore network errors â€” don't block the game */
      }
    },
    [
      completing,
      advancing,
      questionStates,
      currentIndex,
      paramId,
      recordAnswer,
      questions.length,
      advanceIndex,
      triggerComplete,
    ],
  );

  if (!sessionId || !questions.length || !questionStates.length) return null;

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentState = questionStates[currentIndex] || {
    attempts: 0,
    wrongIndices: [],
    resolved: false,
  };

  const isCountdown = timeMode !== "unlimited";
  const timerWarning = isCountdown && timeLeft <= 120 && timeLeft > 30;
  const timerCritical = isCountdown && timeLeft <= 30;
  const answeredCount = questionStates.filter((s) => s.resolved).length;
  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  // Live in-game stars (0.0–8.0): 1.0 for 1st-attempt correct, 0.5 for 2nd-attempt
  const inGameStars = questionStates.reduce((total, qs) => {
    if (!qs.resolved || !qs.correct) return total;
    return total + (qs.attempts === 1 ? 1.0 : 0.5);
  }, 0);

  // Current rank from loaded stats
  const curRankIdx = rankStats?.rankIndex ?? 0;
  const curTier = rankStats?.tier ?? 3;
  const curStars = rankStats?.starsInTier ?? 0;
  const spp = rankStats?.starProtectionPoints ?? 0;
  const sbp = rankStats?.starBonusPoints ?? 0;
  const accentClr =
    RANK_ACCENT[Math.min(curRankIdx, LEGENDARY_SAGE_INDEX)] ?? "#22c55e";

  return (
    <div className="ghp-page">
      {/* Floating glow orbs (same as QuizSetup) */}
      <div className="glb-bg-orb glb-bg-orb--1" />
      <div className="glb-bg-orb glb-bg-orb--2" />
      <div className="glb-bg-orb glb-bg-orb--3" />

      {completing && (
        <div className="ghp-overlay">
          <div className="ghp-overlay-text">{t("game_submitting")}</div>
        </div>
      )}

      {/* â”€â”€ TOP HUD BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="ghp-hud">
        {/* Left: player info + rank badge */}
        <div className="ghp-hud-player">
          <RankBadge
            rankIndex={curRankIdx}
            tier={curTier}
            starsInTier={curStars}
            size="sm"
            showPips={false}
            showLabel={false}
          />
          <div className="ghp-hud-playerinfo">
            <span className="ghp-hud-name">
              {user?.name?.split(" ")[0] || "Player"}
            </span>
            <span
              className="ghp-hud-rank"
              style={{ color: accentClr, fontWeight: 700 }}
            >
              {getRankLabel(curRankIdx, curTier)}
            </span>
          </div>
        </div>

        {/* Center: live stars / SPP shields / SBP gems / streak */}
        <div className="ghp-hud-stats">
          {/* Live in-game stars */}
          <div className="ghp-stat" title="Stars this game">
            <span className="ghp-stat-icon">⭐</span>
            <span className="ghp-stat-val">{inGameStars.toFixed(1)}</span>
            <span className="ghp-stat-label">/8.0</span>
          </div>
          {/* SPP shields */}
          <div className="ghp-stat" title={t("stars_protection")}>
            <span className="ghp-stat-icon">🛡️</span>
            <span className="ghp-stat-val">{spp}</span>
          </div>
          {/* SBP gems */}
          <div className="ghp-stat" title={t("stars_bonus")}>
            <span className="ghp-stat-icon">💎</span>
            <span className="ghp-stat-val">{sbp}</span>
          </div>
          <div
            className={`ghp-stat${streak >= 3 ? " ghp-stat--fire" : ""}`}
            title={t("game_streak")}
          >
            <span className="ghp-stat-icon">🔥</span>
            <span className="ghp-stat-val">{streak}</span>
            <span className="ghp-stat-label">{t("game_streak")}</span>
          </div>
        </div>

        {/* Right: timer */}
        <div
          className={`ghp-timer${timerCritical ? " critical" : timerWarning ? " warning" : ""}`}
          aria-label={`${isCountdown ? t("game_time_remaining") : t("game_time_elapsed")}: ${fmt(timeLeft)}`}
        >
          <div className="ghp-timer-label">
            {isCountdown ? t("game_time_remaining") : t("game_time_elapsed")}
          </div>
          <div className="ghp-timer-digits">
            {timeMode === "unlimited" ? `+${fmt(timeLeft)}` : fmt(timeLeft)}
          </div>
        </div>
      </div>

      {/* â”€â”€ MAIN GAME AREA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="ghp-body">
        {/* LEFT: Question card */}
        <div className="ghp-main">
          {/* Mission badge + lesson tag */}
          <div className="ghp-q-meta">
            <span className="ghp-mission-badge">
              {t("game_mission")} {currentIndex + 1} {t("game_of")}{" "}
              {questions.length}
            </span>
            {lesson && <span className="ghp-lesson-tag">{lesson}</span>}
          </div>

          {/* Question text */}
          <div className="ghp-question-card">
            <p className="ghp-q-text">{currentQ.text}</p>

            {/* Show try-again hint after first wrong attempt */}
            {currentState.attempts === 1 && !currentState.resolved && (
              <div className="ghp-try-again" role="alert">
                {t("game_try_again")}
              </div>
            )}

            {/* Answer buttons */}
            <div className="ghp-answers">
              {currentQ.answers.map((ans, idx) => {
                const isWrong = currentState.wrongIndices.includes(idx);
                const isCorrectAnswer =
                  currentState.resolved &&
                  currentState.correct &&
                  currentState.finalAnswer === idx;
                const isDisabled =
                  completing || advancing || isWrong || currentState.resolved;

                let btnCls = "ghp-answer-btn";
                if (isCorrectAnswer) btnCls += " correct";
                else if (isWrong) btnCls += " wrong";
                else if (isDisabled) btnCls += " disabled";

                return (
                  <button
                    key={idx}
                    className={btnCls}
                    onClick={() => handleSelect(idx)}
                    disabled={isDisabled}
                    aria-label={`${LABELS[idx]}: ${ans.text}`}
                  >
                    <span className="ghp-answer-label">{LABELS[idx]}</span>
                    <span className="ghp-answer-text">{ans.text}</span>
                    {isCorrectAnswer && (
                      <span
                        className="ghp-answer-badge correct-badge"
                        aria-hidden="true"
                      >
                        ✔
                      </span>
                    )}
                    {isWrong && (
                      <span
                        className="ghp-answer-badge wrong-badge"
                        aria-hidden="true"
                      >
                        ✗
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Floating XP indicator */}
            {floatingXP && (
              <div
                className="ghp-floating-xp"
                key={floatingXP.key}
                aria-live="polite"
              >
                +{floatingXP.xp} XP ✨
              </div>
            )}
          </div>

          {/* Mascot hint */}
          {currentState.attempts === 1 && !currentState.resolved && (
            <div className="ghp-mascot">
              <div className="ghp-mascot-avatar" aria-hidden="true">
                🤖
              </div>
              <div className="ghp-mascot-bubble">{t("game_try_again")}</div>
            </div>
          )}
        </div>

        {/* RIGHT: Side panel */}
        <div className="ghp-panel">
          {/* Segmented progress bar */}
          <div className="ghp-panel-section">
            <div className="ghp-panel-label">{t("game_progress")}</div>
            <GameProgressBar
              total={questions.length}
              current={currentIndex}
              states={questionStates}
            />
            <div className="ghp-panel-answered">
              {answeredCount} / {questions.length} {t("game_answered")}
            </div>
          </div>

          {/* Live score */}
          <div className="ghp-panel-section ghp-score-section">
            <div className="ghp-score-num">{score}</div>
            <div className="ghp-score-label">{t("results_points")}</div>
            {streak > 0 && <div className="ghp-streak-badge">🔥 ×{streak}</div>}
          </div>

          {/* Score rewards info */}
          <div className="ghp-rewards-card">
            <div className="ghp-rewards-title">{t("game_score_rewards")}</div>
            <div className="ghp-reward-row">
              <span>✔ 1st attempt correct</span>
              <span className="ghp-reward-xp">+100 pts</span>
            </div>
            <div className="ghp-reward-row">
              <span>↩ 2nd attempt correct</span>
              <span className="ghp-reward-xp">+50 pts</span>
            </div>
            <div className="ghp-reward-row">
              <span>❌ Both wrong</span>
              <span className="ghp-reward-xp">+0 pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPlay;
