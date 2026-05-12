import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { quizAPI } from "../api/quizApi";
import { useQuiz } from "../context/QuizContext";
import { useUILang } from "../context/UILanguageContext";

const LESSONS = [
  { value: "Geometry", icon: "📐", key: "setup_lesson_geometry" },
  { value: "Algebra", icon: "🔣", key: "setup_lesson_algebra" },
  { value: "Numbers", icon: "🔢", key: "setup_lesson_numbers" },
];

const DIFFICULTIES = [
  { value: "Easy", color: "#10B981", key: "setup_diff_easy" },
  { value: "Medium", color: "#F59E0B", key: "setup_diff_medium" },
  { value: "Hard", color: "#EF4444", key: "setup_diff_hard" },
];

const TIME_MODES = [
  {
    value: "8min",
    icon: "⚡",
    labelKey: "setup_time_8min",
    subKey: "setup_time_8min_sub",
  },
  {
    value: "16min",
    icon: "⚖️",
    labelKey: "setup_time_16min",
    subKey: "setup_time_16min_sub",
  },
  {
    value: "unlimited",
    icon: "🐢",
    labelKey: "setup_time_unlimited",
    subKey: "setup_time_unlimited_sub",
  },
];

const LANGUAGES = [
  { value: "en", badge: "EN", label: "English", sub: "English" },
  { value: "si", badge: "සි", label: "සිංහල", sub: "Sinhala" },
  { value: "ta", badge: "த", label: "தமிழ்", sub: "Tamil" },
];

const QuizSetup = () => {
  const [searchParams] = useSearchParams();
  const grade = Number(searchParams.get("grade")) || 9;
  const navigate = useNavigate();
  const { initSession } = useQuiz();
  const { t } = useUILang();

  const [lesson, setLesson] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [timeMode, setTimeMode] = useState(null);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!lesson || !difficulty || !timeMode) {
      setError(t('setup_error'));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await quizAPI.start({
        grade,
        lesson,
        difficulty,
        timeMode,
        language,
      });
      initSession(res.data, { grade, lesson, difficulty, timeMode, language });
      navigate(`/student/quiz/play/${res.data.sessionId}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to start quiz. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectionStyle = (selected) => ({
    border: selected ? "2px solid var(--primary)" : "2px solid var(--border)",
    background: selected ? "rgba(67,97,238,0.06)" : "var(--white)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    transition: "all 0.15s",
    outline: "none",
  });

  return (
    <div className="page-container" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Grade {grade} — {t('setup_title')}</h1>
        <p className="page-subtitle">{t('setup_subtitle')}</p>
      </div>

      {/* Lesson selector */}
      <div
        className="card"
        style={{ marginBottom: "1.2rem", padding: "1.4rem" }}
      >
        <h3 style={{ marginBottom: "1rem", fontWeight: 600 }}>{t('setup_lesson')}</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.8rem",
          }}
        >
          {LESSONS.map(({ value, icon, key }) => (
            <button
              key={value}
              onClick={() => setLesson(value)}
              style={{
                ...selectionStyle(lesson === value),
                padding: "1.2rem",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.3rem" }}>
                {icon}
              </div>
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty selector */}
      <div
        className="card"
        style={{ marginBottom: "1.2rem", padding: "1.4rem" }}
      >
        <h3 style={{ marginBottom: "1rem", fontWeight: 600 }}>
          {t('setup_difficulty')}
        </h3>
        <div style={{ display: "flex", gap: "0.8rem" }}>
          {DIFFICULTIES.map(({ value, color, key }) => (
            <button
              key={value}
              onClick={() => setDifficulty(value)}
              style={{
                flex: 1,
                padding: "0.7rem",
                borderRadius: "20px",
                border:
                  difficulty === value
                    ? `2px solid ${color}`
                    : `2px solid ${color}40`,
                background: difficulty === value ? `${color}18` : "transparent",
                color: color,
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {/* Time mode selector */}
      <div
        className="card"
        style={{ marginBottom: "1.2rem", padding: "1.4rem" }}
      >
        <h3 style={{ marginBottom: "1rem", fontWeight: 600 }}>
          {t('setup_time')}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.8rem",
          }}
        >
          {TIME_MODES.map(({ value, icon, labelKey, subKey }) => (
            <button
              key={value}
              onClick={() => setTimeMode(value)}
              style={{
                ...selectionStyle(timeMode === value),
                padding: "1.2rem 0.8rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
                {icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {t(labelKey)}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.2rem",
                }}
              >
                {t(subKey)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Language selector */}
      <div
        className="card"
        style={{ marginBottom: "1.5rem", padding: "1.4rem" }}
      >
        <h3 style={{ marginBottom: "0.4rem", fontWeight: 600 }}>
          {t('setup_language')}
        </h3>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            marginBottom: "1rem",
            marginTop: 0,
          }}
        >
          {t('setup_language_hint')}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.8rem",
          }}
        >
          {LANGUAGES.map(({ value, badge, label, sub }) => (
            <button
              key={value}
              onClick={() => setLanguage(value)}
              style={{
                ...selectionStyle(language === value),
                padding: "1.1rem 0.8rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  marginBottom: "0.35rem",
                  color: language === value ? "var(--primary)" : "var(--text)",
                }}
              >
                {badge}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {label}
              </div>
              {sub !== label && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.15rem",
                  }}
                >
                  {sub}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={loading || !lesson || !difficulty || !timeMode}
        style={{ fontSize: "1rem", padding: "0.85rem" }}
      >
        {loading ? t('setup_loading') : t('setup_start')}
      </button>
    </div>
  );
};

export default QuizSetup;
