import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { quizAPI } from "../api/quizApi";
import { useQuiz } from "../context/QuizContext";
import { useUILang } from "../context/UILanguageContext";
import { useAuth } from "../context/AuthContext";

const LESSONS = [
  {
    value: "Geometry",
    icon: "📐",
    key: "setup_lesson_geometry",
    color: "#818cf8",
    glow: "rgba(129,140,248,0.4)",
  },
  {
    value: "Algebra",
    icon: "🧮",
    key: "setup_lesson_algebra",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
  },
  {
    value: "Numbers",
    icon: "🔢",
    key: "setup_lesson_numbers",
    color: "#34d399",
    glow: "rgba(52,211,153,0.4)",
  },
];

const DIFFICULTIES = [
  { value: "Easy", color: "#10B981", glow: "rgba(16,185,129,0.4)", icon: "🟢", diffKey: "setup_diff_easy" },
  { value: "Medium", color: "#F59E0B", glow: "rgba(245,158,11,0.4)", icon: "🟡", diffKey: "setup_diff_medium" },
  { value: "Hard", color: "#EF4444", glow: "rgba(239,68,68,0.4)", icon: "🔴", diffKey: "setup_diff_hard" },
];

const TIME_MODES = [
  {
    value: "8min",
    icon: "⚡",
    labelKey: "setup_time_8min",
    subKey: "setup_time_8min_sub",
    color: "#f97316",
    glow: "rgba(249,115,22,0.4)",
  },
  {
    value: "16min",
    icon: "⏳",
    labelKey: "setup_time_16min",
    subKey: "setup_time_16min_sub",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.4)",
  },
  {
    value: "unlimited",
    icon: "♾️",
    labelKey: "setup_time_unlimited",
    subKey: "setup_time_unlimited_sub",
    color: "#a3e635",
    glow: "rgba(163,230,53,0.4)",
  },
];

const LANGUAGES = [
  { value: "en", badge: "EN", label: "English", sub: "English" },
  { value: "si", badge: "සි", label: "සිංහල", sub: "Sinhala" },
  { value: "ta", badge: "த", label: "தமிழ்", sub: "Tamil" },
];

const GRADE_META = {
  9: { emoji: "📐", color: "#818cf8" },
  10: { emoji: "📊", color: "#f472b6" },
  11: { emoji: "🔢", color: "#34d399" },
};

const QuizSetup = () => {
  const [searchParams] = useSearchParams();
  const grade = Number(searchParams.get("grade")) || 9;
  const navigate = useNavigate();
  const { initSession } = useQuiz();
  const { t } = useUILang();
  const { user } = useAuth();

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
          "Failed to start game. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const meta = GRADE_META[grade] || GRADE_META[9];
  const canStart = !loading && !!lesson && !!difficulty && !!timeMode;
  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="glb-page">
      {/* Decorative background elements */}
      <div className="glb-bg-orb glb-bg-orb--1" />
      <div className="glb-bg-orb glb-bg-orb--2" />
      <div className="glb-bg-orb glb-bg-orb--3" />

      <div className="glb-inner">
        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="glb-header">
          <div className="glb-header-text">
            <div className="glb-grade-badge" style={{ color: meta.color }}>
              {meta.emoji} Grade {grade}
            </div>
            <h1 className="glb-title">{t("setup_title")}</h1>
            <p className="glb-subtitle">{t("setup_subtitle")}</p>
          </div>

          {/* Player chip */}
          {user && (
            <div className="glb-player-chip">
              <div className="glb-player-avatar">{initial}</div>
              <div className="glb-player-info">
                <span className="glb-player-name">{user.name?.split(" ")[0]}</span>
                <span className="glb-player-label">{t("setup_player_label")}</span>
              </div>
            </div>
          )}
        </div>

        {/* â”€â”€ Step pills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="glb-steps">
          {[
            { label: t("setup_lesson"), done: !!lesson, val: lesson },
            { label: t("setup_difficulty"), done: !!difficulty, val: difficulty },
            { label: t("setup_time"), done: !!timeMode, val: timeMode },
            { label: t("setup_language"), done: true, val: language.toUpperCase() },
          ].map((step) => (
            <div key={step.label} className={`glb-step${step.done ? " done" : ""}`}>
              <span className="glb-step-check">{step.done ? "✔" : "○"}</span>
              <span className="glb-step-label">{step.label}</span>
              {step.done && step.val && (
                <span className="glb-step-val">{step.val}</span>
              )}
            </div>
          ))}
        </div>

        {/* â”€â”€ Selection Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="glb-grid">
          {/* â‘  Lesson */}
          <div className="glb-card">
            <div className="glb-card-header">
              <span className="glb-card-icon">📚</span>
              <div>
                <div className="glb-card-title">{t("setup_lesson")}</div>
                <div className="glb-card-sub">{t("setup_lesson_sub")}</div>
              </div>
            </div>
            <div className="glb-card-body">
              {LESSONS.map(({ value, icon, key, color, glow }) => (
                <button
                  key={value}
                  className={`glb-opt-btn${lesson === value ? " selected" : ""}`}
                  style={lesson === value ? { "--opt-color": color, "--opt-glow": glow } : { "--opt-color": color, "--opt-glow": glow }}
                  onClick={() => setLesson(value)}
                  aria-pressed={lesson === value}
                >
                  <span className="glb-opt-icon">{icon}</span>
                  <span className="glb-opt-label">{t(key)}</span>
                  {lesson === value && <span className="glb-opt-check" style={{ color }}>✔</span>}
                </button>
              ))}
            </div>
          </div>

          {/* â‘¡ Difficulty */}
          <div className="glb-card">
            <div className="glb-card-header">
              <span className="glb-card-icon">🎯</span>
              <div>
                <div className="glb-card-title">{t("setup_difficulty")}</div>
                <div className="glb-card-sub">{t("setup_difficulty_sub")}</div>
              </div>
            </div>
            <div className="glb-card-body">
              {DIFFICULTIES.map(({ value, color, glow, icon, diffKey }) => (
                <button
                  key={value}
                  className={`glb-opt-btn${difficulty === value ? " selected" : ""}`}
                  style={{ "--opt-color": color, "--opt-glow": glow }}
                  onClick={() => setDifficulty(value)}
                  aria-pressed={difficulty === value}
                >
                  <span className="glb-opt-icon">{icon}</span>
                  <span className="glb-opt-label">{t(diffKey)}</span>
                  {difficulty === value && <span className="glb-opt-check" style={{ color }}>✔</span>}
                </button>
              ))}
            </div>
          </div>

          {/* â‘¢ Time Mode */}
          <div className="glb-card">
            <div className="glb-card-header">
              <span className="glb-card-icon">⏱️</span>
              <div>
                <div className="glb-card-title">{t("setup_time")}</div>
                <div className="glb-card-sub">{t("setup_time_sub")}</div>
              </div>
            </div>
            <div className="glb-card-body">
              {TIME_MODES.map(({ value, icon, labelKey, subKey, color, glow }) => (
                <button
                  key={value}
                  className={`glb-opt-btn glb-opt-btn--time${timeMode === value ? " selected" : ""}`}
                  style={{ "--opt-color": color, "--opt-glow": glow }}
                  onClick={() => setTimeMode(value)}
                  aria-pressed={timeMode === value}
                >
                  <span className="glb-opt-icon">{icon}</span>
                  <div className="glb-opt-info">
                    <span className="glb-opt-label">{t(labelKey)}</span>
                    <span className="glb-opt-sub">{t(subKey)}</span>
                  </div>
                  {timeMode === value && <span className="glb-opt-check" style={{ color }}>✔</span>}
                </button>
              ))}
            </div>
          </div>

          {/* â‘£ Language */}
          <div className="glb-card">
            <div className="glb-card-header">
              <span className="glb-card-icon">🌐</span>
              <div>
                <div className="glb-card-title">{t("setup_language")}</div>
                <div className="glb-card-sub">{t("setup_language_hint")}</div>
              </div>
            </div>
            <div className="glb-card-body">
              {LANGUAGES.map(({ value, badge, label, sub }) => (
                <button
                  key={value}
                  className={`glb-opt-btn glb-opt-btn--lang${language === value ? " selected" : ""}`}
                  style={{ "--opt-color": "#e879f9", "--opt-glow": "rgba(232,121,249,0.4)" }}
                  onClick={() => setLanguage(value)}
                  aria-pressed={language === value}
                >
                  <span className="glb-lang-badge">{badge}</span>
                  <div className="glb-opt-info">
                    <span className="glb-opt-label">{label}</span>
                    {sub !== label && <span className="glb-opt-sub">{sub}</span>}
                  </div>
                  {language === value && <span className="glb-opt-check" style={{ color: "#e879f9" }}>✔</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {error && <div className="glb-error" role="alert">{error}</div>}

        {/* â”€â”€ Start Game Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="glb-start-wrap">
          <button
            className={`glb-start-btn${canStart ? " ready" : ""}`}
            onClick={handleStart}
            disabled={!canStart}
            aria-label={t("setup_start")}
          >
            {loading ? (
              <>
                <span className="glb-spinner" />
                {t("setup_loading")}
              </>
            ) : (
              t("setup_start")
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSetup;
