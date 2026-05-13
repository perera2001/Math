import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizAPI } from "../api/quizApi";
import { useQuiz } from "../context/QuizContext";

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
  const {
    sessionId,
    questions,
    currentIndex,
    timeMode,
    elapsedRef,
    recordAnswer,
    advanceIndex,
  } = useQuiz();

  useEffect(() => {
    if (!sessionId || sessionId.toString() !== paramId) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [sessionId, paramId, navigate]);

  const [timeLeft, setTimeLeft] = useState(() => {
    if (timeMode === "8min") return 480;
    if (timeMode === "16min") return 960;
    return 0;
  });

  const [localAnswers, setLocalAnswers] = useState([]);
  const [visitedSet, setVisitedSet] = useState(new Set([0]));
  const [showReview, setShowReview] = useState(false);
  const [completing, setCompleting] = useState(false);

  const timerRef = useRef(null);
  const completingRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const submittedAnswersRef = useRef({});

  useEffect(() => {
    if (questions.length > 0) {
      setLocalAnswers(new Array(questions.length).fill(null));
      submittedAnswersRef.current = {};
    }
  }, [questions.length]);

  const handleTimeUp = useCallback(() => {
    autoSubmitRef.current = true;
    setShowReview(true);
  }, []);

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

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

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

  useEffect(() => {
    if (showReview && autoSubmitRef.current) {
      const t = setTimeout(() => triggerComplete(), 3000);
      return () => clearTimeout(t);
    }
  }, [showReview, triggerComplete]);

  const handleSelect = (idx) => {
    if (completing) return;
    setLocalAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = idx;
      return updated;
    });
    if (submittedAnswersRef.current[currentIndex] !== idx) {
      submittedAnswersRef.current[currentIndex] = idx;
      quizAPI
        .answer({
          sessionId: paramId,
          questionIndex: currentIndex,
          answerIndex: idx,
          timeSpent: 0,
        })
        .then((res) => recordAnswer(res.data))
        .catch(() => {});
    }
  };

  const goTo = (idx) => {
    advanceIndex(idx);
    setVisitedSet((prev) => new Set([...prev, idx]));
  };

  const handlePrev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };
  const handleNext = () => {
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
    else setShowReview(true);
  };

  if (!sessionId || !questions.length) return null;
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isCountdown = timeMode !== "unlimited";
  const timerWarning = isCountdown && timeLeft <= 120 && timeLeft > 30;
  const timerCritical = isCountdown && timeLeft <= 30;
  const answeredCount = localAnswers.filter((a) => a !== null).length;

  /* REVIEW SHEET */
  if (showReview) {
    return (
      <div className="qp-page">
        {autoSubmitRef.current && (
          <div className="qp-time-expired-banner">
            Time&apos;s up! Auto-submitting in 3 seconds...
          </div>
        )}
        <div className="qp-review-sheet">
          <div className="qp-review-header">
            <div className="qp-review-header-icon">&#128203;</div>
            <h2 className="qp-review-title">Review Your Answers</h2>
            <p className="qp-review-subtitle">
              {answeredCount} of {questions.length} questions answered
            </p>
          </div>

          <div className="qp-review-list">
            {questions.map((q, i) => {
              const ans = localAnswers[i];
              return (
                <div
                  key={i}
                  className={`qp-review-row ${ans !== null ? "qp-review-row--answered" : "qp-review-row--blank"}`}
                >
                  <div className="qp-review-num">
                    <span
                      className={`qp-review-badge ${ans !== null ? "qp-review-badge--answered" : "qp-review-badge--blank"}`}
                    >
                      Q{i + 1}
                    </span>
                  </div>
                  <div className="qp-review-body">
                    <div className="qp-review-qtext">{q.text}</div>
                    <div className="qp-review-ans">
                      {ans !== null ? (
                        <span className="qp-review-ans--picked">
                          <span className="qp-review-label">{LABELS[ans]}</span>
                          <span>{q.answers[ans]?.text}</span>
                        </span>
                      ) : (
                        <span className="qp-review-ans--none">
                          Not answered
                        </span>
                      )}
                    </div>
                  </div>
                  {!autoSubmitRef.current && (
                    <button
                      className="qp-review-edit"
                      onClick={() => {
                        setShowReview(false);
                        goTo(i);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="qp-review-footer">
            {!autoSubmitRef.current && (
              <button
                className="qp-review-back-btn"
                onClick={() => setShowReview(false)}
              >
                ← Back to Quiz
              </button>
            )}
            <button
              className="qp-review-submit-btn"
              onClick={triggerComplete}
              disabled={completing}
            >
              {completing ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>

        {completing && (
          <div className="qp-overlay">Finalising your quiz...</div>
        )}
      </div>
    );
  }

  /* MAIN QUIZ LAYOUT */
  return (
    <div className="qp-page">
      <div className="qp-layout">
        {/* LEFT: Question + Answers */}
        <div className="qp-main">
          <div className="qp-question-card">
            <div className="qp-q-meta">
              <span className="qp-q-num">Question {currentIndex + 1}</span>
              <span className="qp-q-of">of {questions.length}</span>
            </div>

            <div className="qp-q-text">{currentQ.text}</div>

            <div className="qp-answers">
              {currentQ.answers.map((ans, idx) => {
                const isSelected = localAnswers[currentIndex] === idx;
                return (
                  <button
                    key={idx}
                    className={`qp-answer${isSelected ? " qp-answer--selected" : ""}`}
                    onClick={() => handleSelect(idx)}
                    disabled={completing}
                  >
                    <span className="qp-answer-label">{LABELS[idx]}</span>
                    <span className="qp-answer-text">{ans.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="qp-nav">
            <button
              className="qp-nav-btn qp-nav-btn--prev"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>

            <span
              className={`qp-nav-status ${localAnswers[currentIndex] !== null ? "qp-nav-status--answered" : ""}`}
            >
              {localAnswers[currentIndex] !== null
                ? "Answered"
                : "Not answered"}
            </span>

            <button
              className="qp-nav-btn qp-nav-btn--next"
              onClick={handleNext}
            >
              {currentIndex === questions.length - 1
                ? "Review & Submit"
                : "Next →"}
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="qp-sidebar">
          {/* Timer card */}
          <div
            className={`qp-timer-card${timerCritical ? " qp-timer--critical" : timerWarning ? " qp-timer--warning" : ""}`}
          >
            <div className="qp-timer-label">
              {isCountdown ? "TIME REMAINING" : "TIME ELAPSED"}
            </div>
            <div className="qp-timer-display">
              {timeMode === "unlimited" ? `+${fmt(timeLeft)}` : fmt(timeLeft)}
            </div>
            {timerWarning && !timerCritical && (
              <div className="qp-timer-msg qp-timer-msg--warn">
                Less than 2 minutes!
              </div>
            )}
            {timerCritical && (
              <div className="qp-timer-msg qp-timer-msg--crit">Hurry up!</div>
            )}
          </div>

          {/* Question tracker card */}
          <div className="qp-tracker-card">
            <div className="qp-tracker-title">Questions</div>
            <div className="qp-tracker-grid">
              {questions.map((_, i) => {
                const answered = localAnswers[i] !== null;
                const visited = visitedSet.has(i);
                const isCurrent = i === currentIndex;
                const skipped = visited && !answered && !isCurrent;
                return (
                  <button
                    key={i}
                    className={[
                      "qp-dot",
                      answered ? "qp-dot--answered" : "",
                      skipped ? "qp-dot--skipped" : "",
                      isCurrent ? "qp-dot--current" : "",
                    ]
                      .join(" ")
                      .trim()}
                    onClick={() => goTo(i)}
                    title={`Q${i + 1}${answered ? " - Answered" : skipped ? " - Skipped" : ""}`}
                  >
                    {skipped ? "x" : i + 1}
                  </button>
                );
              })}
            </div>

            <div className="qp-tracker-legend">
              <span className="qp-leg">
                <span className="qp-leg-dot qp-leg-dot--answered" />
                Answered
              </span>
              <span className="qp-leg">
                <span className="qp-leg-dot qp-leg-dot--skipped" />
                Skipped
              </span>
              <span className="qp-leg">
                <span className="qp-leg-dot qp-leg-dot--current" />
                Current
              </span>
            </div>

            <div className="qp-tracker-count">
              {answeredCount} / {questions.length} answered
            </div>

            <button
              className="qp-review-trigger"
              onClick={() => setShowReview(true)}
            >
              Review &amp; Submit
            </button>
          </div>
        </div>
      </div>

      {completing && <div className="qp-overlay">Finalising your quiz...</div>}
    </div>
  );
};

export default QuizPlay;
