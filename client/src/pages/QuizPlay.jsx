import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizAPI } from '../api/quizApi';
import { useQuiz } from '../context/QuizContext';

const LABELS = ['A', 'B', 'C', 'D'];

const fmt = (secs) => {
  const m = Math.floor(Math.abs(secs) / 60)
    .toString()
    .padStart(2, '0');
  const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const QuizPlay = () => {
  const { sessionId: paramId } = useParams();
  const navigate = useNavigate();
  const {
    sessionId,
    questions,
    currentIndex,
    score,
    streak,
    lifelinesUsed,
    timeMode,
    difficulty,
    grade,
    elapsedRef,
    recordAnswer,
    markLifeline,
    advanceIndex,
    clearSession,
  } = useQuiz();

  // If context lost (e.g. page refresh), redirect to dashboard
  useEffect(() => {
    if (!sessionId || sessionId.toString() !== paramId) {
      navigate('/student/dashboard', { replace: true });
    }
  }, [sessionId, paramId, navigate]);

  const [timeLeft, setTimeLeft] = useState(() => {
    if (timeMode === '8min') return 480;
    if (timeMode === '16min') return 960;
    return 0; // count-up for unlimited
  });

  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const [hiddenIndices, setHiddenIndices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const questionStartRef = useRef(Date.now());
  const timerRef = useRef(null);
  const completingRef = useRef(false); // prevent double-complete

  // Timer
  useEffect(() => {
    if (!sessionId) return;

    timerRef.current = setInterval(() => {
      if (timeMode === 'unlimited') {
        elapsedRef.current += 1;
        setTimeLeft((t) => t + 1);
      } else {
        setTimeLeft((t) => {
          const next = t - 1;
          elapsedRef.current += 1;
          if (next <= 0) {
            clearInterval(timerRef.current);
            triggerComplete();
          }
          return Math.max(next, 0);
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, timeMode]);

  // Confirm on browser back / refresh
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
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

  const handleSelect = async (idx) => {
    if (locked || submitting || hiddenIndices.includes(idx)) return;
    setSelected(idx);
    setLocked(true);
    setSubmitting(true);

    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);

    try {
      const res = await quizAPI.answer({
        sessionId: paramId,
        questionIndex: currentIndex,
        answerIndex: idx,
        timeSpent,
      });
      const result = res.data;
      setServerResult(result);
      recordAnswer(result);

      // Wait 1.2s to show feedback, then advance
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
          triggerComplete();
        } else {
          advanceIndex(nextIndex);
          setSelected(null);
          setLocked(false);
          setServerResult(null);
          setHiddenIndices([]);
          questionStartRef.current = Date.now();
        }
        setSubmitting(false);
      }, 1200);
    } catch {
      setSubmitting(false);
      setLocked(false);
      setSelected(null);
    }
  };

  const handleLifeline = async (type) => {
    if (lifelinesUsed[type] || submitting) return;
    if (type === 'extraTime' && timeMode === 'unlimited') return;

    try {
      const res = await quizAPI.lifeline({ sessionId: paramId, type });
      markLifeline(type);

      if (type === 'fiftyFifty') {
        setHiddenIndices(res.data.hideIndices || []);
      } else if (type === 'skip') {
        const nextIndex = res.data.newQuestionIndex;
        if (nextIndex >= questions.length) {
          triggerComplete();
        } else {
          advanceIndex(nextIndex);
          setSelected(null);
          setLocked(false);
          setServerResult(null);
          setHiddenIndices([]);
          questionStartRef.current = Date.now();
        }
      } else if (type === 'extraTime') {
        // Add 30s to timer
        setTimeLeft((t) => t + 30);
      }
    } catch (err) {
      // silently ignore (already used etc.)
    }
  };

  if (!sessionId || !questions.length) return null;

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isCountdown = timeMode !== 'unlimited';
  const timerCritical = isCountdown && timeLeft <= 30;

  const getOptionStyle = (idx) => {
    const base = {
      display: 'flex',
      alignItems: 'center',
      gap: '0.9rem',
      padding: '1rem 1.2rem',
      borderRadius: 'var(--radius)',
      border: '2px solid var(--border)',
      background: 'var(--white)',
      cursor: hiddenIndices.includes(idx) ? 'default' : 'pointer',
      opacity: hiddenIndices.includes(idx) ? 0.3 : 1,
      transition: 'all 0.15s',
      width: '100%',
      textAlign: 'left',
      fontSize: '1rem',
    };

    if (!locked) {
      if (selected === idx) {
        base.border = '2px solid var(--primary)';
        base.background = 'rgba(67,97,238,0.06)';
      }
      return base;
    }

    // Locked — show feedback
    if (serverResult) {
      if (idx === serverResult.correctAnswerIndex) {
        base.border = '2px solid #10B981';
        base.background = '#d1fae5';
      } else if (idx === selected && !serverResult.isCorrect) {
        base.border = '2px solid #EF4444';
        base.background = '#fee2e2';
      }
    }
    base.cursor = 'default';
    return base;
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: '0.9rem 1.4rem',
          boxShadow: 'var(--shadow)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-muted)' }}>
          {currentIndex + 1} / {questions.length}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: timerCritical ? '#EF4444' : 'var(--text)',
              transition: 'color 0.3s',
            }}
          >
            {timeMode === 'unlimited' ? `+${fmt(timeLeft)}` : fmt(timeLeft)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{score} pts</span>
          {streak >= 2 && (
            <span
              style={{
                background: '#fef3c7',
                color: '#d97706',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              🔥 ×{streak}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div
        className="card"
        style={{ padding: '1.8rem', fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6 }}
      >
        {currentQ.text}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {currentQ.answers.map((ans, idx) => (
          <button key={idx} style={getOptionStyle(idx)} onClick={() => handleSelect(idx)}>
            <span
              style={{
                minWidth: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {LABELS[idx]}
            </span>
            <span>{ans.text}</span>
          </button>
        ))}
      </div>

      {/* Lifelines */}
      <div
        style={{
          display: 'flex',
          gap: '0.8rem',
          justifyContent: 'center',
          paddingTop: '0.4rem',
        }}
      >
        <button
          onClick={() => handleLifeline('fiftyFifty')}
          disabled={lifelinesUsed.fiftyFifty || locked}
          title="50/50 — Remove 2 wrong answers"
          style={{
            padding: '0.5rem 1.1rem',
            borderRadius: '20px',
            border: '2px solid var(--border)',
            background: lifelinesUsed.fiftyFifty ? 'var(--bg)' : 'var(--white)',
            opacity: lifelinesUsed.fiftyFifty ? 0.45 : 1,
            cursor: lifelinesUsed.fiftyFifty ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          50 / 50
        </button>

        <button
          onClick={() => handleLifeline('skip')}
          disabled={lifelinesUsed.skip || locked}
          title="Skip this question"
          style={{
            padding: '0.5rem 1.1rem',
            borderRadius: '20px',
            border: '2px solid var(--border)',
            background: lifelinesUsed.skip ? 'var(--bg)' : 'var(--white)',
            opacity: lifelinesUsed.skip ? 0.45 : 1,
            cursor: lifelinesUsed.skip ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          ⏭ Skip
        </button>

        {timeMode !== 'unlimited' && (
          <button
            onClick={() => handleLifeline('extraTime')}
            disabled={lifelinesUsed.extraTime || locked}
            title="+30 seconds"
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '20px',
              border: '2px solid var(--border)',
              background: lifelinesUsed.extraTime ? 'var(--bg)' : 'var(--white)',
              opacity: lifelinesUsed.extraTime ? 0.45 : 1,
              cursor: lifelinesUsed.extraTime ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            +30s ⏱
          </button>
        )}
      </div>

      {completing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          Finalising your quiz…
        </div>
      )}
    </div>
  );
};

export default QuizPlay;
