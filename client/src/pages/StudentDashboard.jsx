import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quizAPI } from '../api/quizApi';

const GRADE_CARDS = [
  { grade: 9, icon: '📐', label: 'Grade 9' },
  { grade: 10, icon: '📊', label: 'Grade 10' },
  { grade: 11, icon: '🔢', label: 'Grade 11' },
];

const DIFF_COLORS = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' };
const STAR_COLOR = '#FBBF24';

const StudentDashboard = () => {
  const { user } = useAuth();
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
        setHistory(historyRes.data.sessions.slice(0, 5));
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
      <span key={i} style={{ color: i < count ? STAR_COLOR : '#d1d5db', fontSize: '1rem' }}>
        ★
      </span>
    ));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Ready for a challenge?</p>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#fff',
            padding: '0.6rem 1.2rem',
            borderRadius: '24px',
            fontWeight: 700,
            fontSize: '1.1rem',
            boxShadow: '0 2px 8px rgba(251,191,36,0.4)',
          }}
        >
          ⭐ {loading ? '—' : stats?.totalStars ?? 0} Stars
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {[
          { label: 'Total Quizzes', value: stats?.totalQuizzes ?? 0, icon: '🎯' },
          { label: 'Total Stars', value: stats?.totalStars ?? 0, icon: '⭐' },
          { label: 'Perfect Quizzes', value: stats?.perfectQuizzes ?? 0, icon: '🏆' },
          { label: 'Best Streak', value: stats?.bestStreak ?? 0, icon: '🔥' },
        ].map((card) => (
          <div key={card.label} className="card" style={{ textAlign: 'center', padding: '1.2rem' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{card.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>
              {loading ? '—' : card.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Grade cards */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>Start a Quiz</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.2rem',
          marginBottom: '2.5rem',
        }}
      >
        {GRADE_CARDS.map(({ grade, icon, label }) => (
          <div
            key={grade}
            className="card"
            style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              cursor: 'default',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(67,97,238,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{icon}</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>{label}</h3>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', padding: '0.6rem 1.8rem' }}
              onClick={() => navigate(`/student/quiz/setup?grade=${grade}`)}
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>

      {/* Recent History */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>Recent History</h2>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No quizzes completed yet. Start one above!
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {history.map((s, i) => (
            <div
              key={s._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.4rem',
                borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <span
                  style={{
                    background: DIFF_COLORS[s.difficulty] + '20',
                    color: DIFF_COLORS[s.difficulty],
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {s.difficulty}
                </span>
                <span style={{ fontWeight: 600 }}>{s.lesson}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Grade {s.grade}</span>
              </div>
              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.totalScore} pts</span>
                <span>{renderStars(s.starsEarned)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
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
