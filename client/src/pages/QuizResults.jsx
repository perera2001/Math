import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizAPI } from '../api/quizApi';

const STAR_COLOR = '#FBBF24';
const STAR_EMPTY = '#d1d5db';

/* Simple CSS confetti — 20 coloured spans positioned absolutely */
const Confetti = () => {
  const colours = ['#FBBF24', '#10B981', '#4361ee', '#EF4444', '#a78bfa', '#f472b6'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: `${Math.random() * 40}%`,
            left: `${Math.random() * 100}%`,
            width: 10,
            height: 10,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
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
  const [result, setResult] = useState(null);
  const [visibleStars, setVisibleStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState(null);
  const animRef = useRef(null);

  useEffect(() => {
    // Results are passed from QuizPlay via navigation but may not exist if user
    // lands directly — fetch from history in that case.
    const load = async () => {
      try {
        const res = await quizAPI.getHistory();
        const session = res.data.sessions.find((s) => s._id === sessionId);
        if (session) {
          setResult(session);
          setGrade(session.grade);
        }
      } catch {
        // ignore
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
    if (!secs && secs !== 0) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loading) return <div className="page-loading">Loading results…</div>;

  if (!result) {
    return (
      <div className="page-container" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Results not found.</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem', width: 'auto' }} onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const correctCount = result.totalScore !== undefined
    ? (result.perQuestion ? result.perQuestion.filter((q) => q.isCorrect).length : '—')
    : '—';

  const lifelinesCount = result.lifelinesUsed
    ? Object.values(result.lifelinesUsed).filter(Boolean).length
    : 0;

  const showConfetti = result.starsEarned >= 3;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem', position: 'relative' }}>
      {showConfetti && <Confetti />}

      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
        {/* Stars */}
        <div style={{ marginBottom: '1rem' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              style={{
                fontSize: '2.8rem',
                color: i < visibleStars ? STAR_COLOR : STAR_EMPTY,
                transition: 'color 0.3s',
                filter: i < visibleStars ? 'drop-shadow(0 0 6px #fbbf24aa)' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: 'var(--primary)',
            lineHeight: 1,
            marginBottom: '0.4rem',
          }}
        >
          {result.totalScore ?? 0}
        </div>
        <div style={{ color: 'var(--text-muted)', marginBottom: '1.8rem' }}>points</div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.8rem',
            marginBottom: '2rem',
          }}
        >
          {[
            { label: 'Correct', value: `${correctCount}/8`, icon: '✅' },
            { label: 'Time Used', value: fmt(result.timeUsed), icon: '⏱' },
            { label: 'Max Streak', value: result.maxStreak ?? 0, icon: '🔥' },
            { label: 'Lifelines', value: lifelinesCount, icon: '🛟' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--bg)',
                borderRadius: '10px',
                padding: '0.8rem 0.5rem',
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.7rem 1.6rem' }}
            onClick={() => navigate(`/student/quiz/setup?grade=${grade || 9}`)}
          >
            🔄 Play Again
          </button>
          <button
            className="btn"
            style={{
              width: 'auto',
              padding: '0.7rem 1.6rem',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '2px solid var(--border)',
            }}
            onClick={() => navigate('/student/dashboard')}
          >
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
