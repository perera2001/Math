import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quizAPI } from '../api/quizApi';
import { useQuiz } from '../context/QuizContext';

const LESSONS = [
  { value: 'Geometry', icon: '📐' },
  { value: 'Algebra', icon: '🔣' },
  { value: 'Numbers', icon: '🔢' },
];

const DIFFICULTIES = [
  { value: 'Easy', color: '#10B981' },
  { value: 'Medium', color: '#F59E0B' },
  { value: 'Hard', color: '#EF4444' },
];

const TIME_MODES = [
  { value: '8min', icon: '⚡', label: '8 Minutes', sub: 'High Risk · 2× Score' },
  { value: '16min', icon: '⚖️', label: '16 Minutes', sub: 'Balanced · 1× Score' },
  { value: 'unlimited', icon: '🐢', label: 'Unlimited', sub: 'Practice · 0.5× Score' },
];

const LANGUAGES = [
  { value: 'en', badge: 'EN', label: 'English', sub: 'English' },
  { value: 'si', badge: 'සි', label: 'සිංහල', sub: 'Sinhala' },
  { value: 'ta', badge: 'த', label: 'தமிழ்', sub: 'Tamil' },
];

const QuizSetup = () => {
  const [searchParams] = useSearchParams();
  const grade = Number(searchParams.get('grade')) || 9;
  const navigate = useNavigate();
  const { initSession } = useQuiz();

  const [lesson, setLesson] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [timeMode, setTimeMode] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!lesson || !difficulty || !timeMode) {
      setError('Please select a lesson, difficulty, and time mode.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await quizAPI.start({ grade, lesson, difficulty, timeMode, language });
      initSession(res.data, { grade, lesson, difficulty, timeMode, language });
      navigate(`/student/quiz/play/${res.data.sessionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectionStyle = (selected) => ({
    border: selected ? '2px solid var(--primary)' : '2px solid var(--border)',
    background: selected ? 'rgba(67,97,238,0.06)' : 'var(--white)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    outline: 'none',
  });

  return (
    <div className="page-container" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Grade {grade} — Configure Your Quiz</h1>
        <p className="page-subtitle">8 questions · customise your challenge</p>
      </div>

      {/* Lesson selector */}
      <div className="card" style={{ marginBottom: '1.2rem', padding: '1.4rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Select Lesson</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
          {LESSONS.map(({ value, icon }) => (
            <button
              key={value}
              onClick={() => setLesson(value)}
              style={{
                ...selectionStyle(lesson === value),
                padding: '1.2rem',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{icon}</div>
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="card" style={{ marginBottom: '1.2rem', padding: '1.4rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Select Difficulty</h3>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {DIFFICULTIES.map(({ value, color }) => (
            <button
              key={value}
              onClick={() => setDifficulty(value)}
              style={{
                flex: 1,
                padding: '0.7rem',
                borderRadius: '20px',
                border: difficulty === value ? `2px solid ${color}` : `2px solid ${color}40`,
                background: difficulty === value ? `${color}18` : 'transparent',
                color: color,
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Time mode selector */}
      <div className="card" style={{ marginBottom: '1.2rem', padding: '1.4rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Select Time Mode</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
          {TIME_MODES.map(({ value, icon, label, sub }) => (
            <button
              key={value}
              onClick={() => setTimeMode(value)}
              style={{
                ...selectionStyle(timeMode === value),
                padding: '1.2rem 0.8rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Language selector */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.4rem' }}>
        <h3 style={{ marginBottom: '0.4rem', fontWeight: 600 }}>Select Language</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: 0 }}>
          Questions will be shown in your chosen language where available.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
          {LANGUAGES.map(({ value, badge, label, sub }) => (
            <button
              key={value}
              onClick={() => setLanguage(value)}
              style={{
                ...selectionStyle(language === value),
                padding: '1.1rem 0.8rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  marginBottom: '0.35rem',
                  color: language === value ? 'var(--primary)' : 'var(--text)',
                }}
              >
                {badge}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</div>
              {sub !== label && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={loading || !lesson || !difficulty || !timeMode}
        style={{ fontSize: '1rem', padding: '0.85rem' }}
      >
        {loading ? 'Loading questions…' : '🚀 Start Quiz'}
      </button>
    </div>
  );
};

export default QuizSetup;
