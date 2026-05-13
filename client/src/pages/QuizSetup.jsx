import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { quizAPI } from "../api/quizApi";
import { useQuiz } from "../context/QuizContext";
import { useUILang } from "../context/UILanguageContext";

const LESSONS = [
  {
    value: "Geometry",
    icon: "📐",
    key: "setup_lesson_geometry",
    color: "#3b82f6",
    bg: "#dbeafe",
  },
  {
    value: "Algebra",
    icon: "🔣",
    key: "setup_lesson_algebra",
    color: "#8b5cf6",
    bg: "#ede9fe",
  },
  {
    value: "Numbers",
    icon: "🔢",
    key: "setup_lesson_numbers",
    color: "#14b8a6",
    bg: "#ccfbf1",
  },
];

const DIFFICULTIES = [
  { value: "Easy", color: "#10B981", bg: "#d1fae5", icon: "🟢" },
  { value: "Medium", color: "#F59E0B", bg: "#fef3c7", icon: "🟡" },
  { value: "Hard", color: "#EF4444", bg: "#fee2e2", icon: "🔴" },
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

const GRADE_META = {
  9: { emoji: "📐", desc: "Foundations of secondary math" },
  10: { emoji: "📊", desc: "Intermediate concepts & algebra" },
  11: { emoji: "🔢", desc: "Advanced topics & exam prep" },
};

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
      setError(t("setup_error"));
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

  const meta = GRADE_META[grade] || GRADE_META[9];
  const canStart = !loading && !!lesson && !!difficulty && !!timeMode;

  return (
    <div className="sd-page qs-page">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="sd-header">
        <div className="sd-welcome-text">
          <h1>
            {meta.emoji} Grade {grade} — {t("setup_title")}
          </h1>
          <p>{t("setup_subtitle")}</p>
        </div>
        <button
          className="qs-start-fab"
          onClick={handleStart}
          disabled={!canStart}
        >
          {loading ? (
            <span className="qs-fab-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          {loading ? t("setup_loading") : t("setup_start")}
        </button>
      </div>

      {/* ── Progress pills ──────────────────────────────────────── */}
      <div className="qs-progress">
        {[
          { label: "Lesson", done: !!lesson, value: lesson },
          { label: "Difficulty", done: !!difficulty, value: difficulty },
          { label: "Time Mode", done: !!timeMode, value: timeMode },
          { label: "Language", done: true, value: language.toUpperCase() },
        ].map((step) => (
          <div
            key={step.label}
            className={`qs-pill${step.done ? " done" : ""}`}
          >
            <span className="qs-pill-check">{step.done ? "✓" : "○"}</span>
            <span className="qs-pill-label">{step.label}</span>
            {step.done && step.value && (
              <span className="qs-pill-value">{step.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="qs-grid">
        {/* ① Lesson — cols 1-2, rows 1-2 (large teal) */}
        <div className="sd-card sd-accent-teal qs-area-lesson">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-teal">📚</div>
            <div>
              <div className="sd-card-title">{t("setup_lesson")}</div>
              <div className="sd-card-subtitle">
                Choose a subject to practise
              </div>
            </div>
          </div>
          <div className="sd-card-body qs-lesson-body">
            {LESSONS.map(({ value, icon, key, color, bg }) => (
              <button
                key={value}
                className={`qs-lesson-btn${lesson === value ? " selected" : ""}`}
                style={{
                  "--lc": color,
                  "--lb": bg,
                  borderColor: lesson === value ? color : "var(--border)",
                  background: lesson === value ? bg : "#fff",
                }}
                onClick={() => setLesson(value)}
              >
                <span className="qs-lesson-icon">{icon}</span>
                <div className="qs-lesson-info">
                  <span className="qs-lesson-name">{t(key)}</span>
                  <span
                    className="qs-lesson-dot"
                    style={{ background: color }}
                  />
                </div>
                {lesson === value && (
                  <span className="qs-lesson-check" style={{ color }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ② Difficulty — col 3-4, row 1 (blue) */}
        <div className="sd-card sd-accent-blue qs-area-diff">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-blue">🎯</div>
            <div>
              <div className="sd-card-title">{t("setup_difficulty")}</div>
              <div className="sd-card-subtitle">Pick your challenge level</div>
            </div>
          </div>
          <div className="sd-card-body qs-diff-body">
            {DIFFICULTIES.map(({ value, color, bg, icon }) => (
              <button
                key={value}
                className={`qs-diff-btn${difficulty === value ? " selected" : ""}`}
                style={{
                  borderColor: difficulty === value ? color : `${color}40`,
                  background: difficulty === value ? bg : "transparent",
                  color: color,
                }}
                onClick={() => setDifficulty(value)}
              >
                <span>{icon}</span>
                <span className="qs-diff-label">{value}</span>
                {difficulty === value && (
                  <span className="qs-diff-tick">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ③ Time Mode — col 3-4, row 2 (terracotta) */}
        <div className="sd-card sd-accent-terra qs-area-time">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-terra">⏱</div>
            <div>
              <div className="sd-card-title">{t("setup_time")}</div>
              <div className="sd-card-subtitle">How long do you have?</div>
            </div>
          </div>
          <div className="sd-card-body qs-time-body">
            {TIME_MODES.map(({ value, icon, labelKey, subKey }) => (
              <button
                key={value}
                className={`qs-time-btn${timeMode === value ? " selected" : ""}`}
                onClick={() => setTimeMode(value)}
              >
                <span className="qs-time-icon">{icon}</span>
                <div className="qs-time-info">
                  <span className="qs-time-name">{t(labelKey)}</span>
                  <span className="qs-time-sub">{t(subKey)}</span>
                </div>
                {timeMode === value && <span className="qs-time-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ④ Language — cols 1-4, row 3 (pink) */}
        <div className="sd-card sd-accent-pink qs-area-lang">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-pink">🌐</div>
            <div>
              <div className="sd-card-title">{t("setup_language")}</div>
              <div className="sd-card-subtitle">{t("setup_language_hint")}</div>
            </div>
          </div>
          <div className="sd-card-body qs-lang-body">
            {LANGUAGES.map(({ value, badge, label, sub }) => (
              <button
                key={value}
                className={`qs-lang-btn${language === value ? " selected" : ""}`}
                onClick={() => setLanguage(value)}
              >
                <span className="qs-lang-badge">{badge}</span>
                <div className="qs-lang-info">
                  <span className="qs-lang-name">{label}</span>
                  {sub !== label && <span className="qs-lang-sub">{sub}</span>}
                </div>
                {language === value && <span className="qs-lang-check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error + Bottom Start ─────────────────────────────────── */}
      {error && <div className="qs-error">{error}</div>}

      <div className="qs-start-btn-wrap">
        <button
          className="qs-start-btn"
          onClick={handleStart}
          disabled={!canStart}
        >
          {loading ? (
            <>
              <span className="qs-fab-spinner" /> {t("setup_loading")}
            </>
          ) : (
            <>&#9654; {t("setup_start")}</>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizSetup;
