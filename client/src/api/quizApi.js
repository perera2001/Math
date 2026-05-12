import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const quizApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

quizApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

quizApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const quizAPI = {
  start: (data) => quizApi.post('/quiz/start', data),
  answer: (data) => quizApi.post('/quiz/answer', data),
  lifeline: (data) => quizApi.post('/quiz/lifeline', data),
  complete: (data) => quizApi.post('/quiz/complete', data),
  getResult: (sessionId) => quizApi.get(`/quiz/result/${sessionId}`),
  explainAnswer: (data) => quizApi.post('/quiz/explain-answer', data),
  getHistory: () => quizApi.get('/quiz/history'),
  getStats: () => quizApi.get('/quiz/stats'),
};
