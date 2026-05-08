import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const QuizContext = createContext(null);

export const QuizProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // per-question result from server
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lifelinesUsed, setLifelinesUsed] = useState({
    fiftyFifty: false,
    skip: false,
    extraTime: false,
  });
  const [grade, setGrade] = useState(null);
  const [timeMode, setTimeMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [lesson, setLesson] = useState(null);

  // Track elapsed time (seconds) — updated by QuizPlay
  const elapsedRef = useRef(0);

  const initSession = useCallback((data, config) => {
    setSessionId(data.sessionId);
    setQuestions(data.questions);
    setCurrentIndex(0);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    setLifelinesUsed({ fiftyFifty: false, skip: false, extraTime: false });
    setGrade(config.grade);
    setTimeMode(config.timeMode);
    setDifficulty(config.difficulty);
    setLesson(config.lesson);
    elapsedRef.current = 0;
  }, []);

  const recordAnswer = useCallback((result) => {
    setAnswers((prev) => [...prev, result]);
    setScore(result.currentScore);
    setStreak(result.currentStreak);
  }, []);

  const markLifeline = useCallback((type) => {
    setLifelinesUsed((prev) => ({ ...prev, [type]: true }));
  }, []);

  const advanceIndex = useCallback((idx) => {
    setCurrentIndex(idx);
  }, []);

  const clearSession = useCallback(() => {
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    elapsedRef.current = 0;
  }, []);

  return (
    <QuizContext.Provider
      value={{
        sessionId,
        questions,
        currentIndex,
        answers,
        score,
        streak,
        lifelinesUsed,
        grade,
        timeMode,
        difficulty,
        lesson,
        elapsedRef,
        initSession,
        recordAnswer,
        markLifeline,
        advanceIndex,
        clearSession,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within a QuizProvider');
  return ctx;
};
