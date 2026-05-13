import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LESSONS = ['Geometry', 'Algebra', 'Numbers'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const GRADES = [9, 10, 11];

const parseGradeNumber = (gradeStr) => {
  if (!gradeStr) return null;
  const match = String(gradeStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const CreateQuestion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const userGradeNumber = parseGradeNumber(user?.grade);

  const [form, setForm] = useState({
    lesson: '',
    difficulty: '',
    questionText: '',
    grade: isSuperAdmin ? '' : userGradeNumber,
  });
  const [answers, setAnswers] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  const [siQuestion, setSiQuestion] = useState('');
  const [siAnswers, setSiAnswers] = useState([]);
  const [taQuestion, setTaQuestion] = useState('');
  const [taAnswers, setTaAnswers] = useState([]);
  const [translationDone, setTranslationDone] = useState(false);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) =>
      prev.map((ans, i) => (i === index ? { ...ans, text: value } : ans))
    );
  };

  const handleCorrectChange = (index) => {
    setAnswers((prev) =>
      prev.map((ans, i) => ({ ...ans, isCorrect: i === index }))
    );
  };

  const addAnswer = () => {
    setAnswers((prev) => [...prev, { text: '', isCorrect: false }]);
    setSiAnswers((prev) => [...prev, '']);
    setTaAnswers((prev) => [...prev, '']);
  };

  const removeAnswer = (index) => {
    if (answers.length <= 2) return;
    setAnswers((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index].isCorrect && updated.length > 0) {
        updated[0].isCorrect = true;
      }
      return updated;
    });
    setSiAnswers((prev) => prev.filter((_, i) => i !== index));
    setTaAnswers((prev) => prev.filter((_, i) => i !== index));
  };

  const canTranslate =
    form.lesson &&
    form.difficulty &&
    form.questionText.trim().length >= 10 &&
    answers.every((a) => a.text.trim()) &&
    answers.some((a) => a.isCorrect);

  const handleTranslate = async () => {
    setTranslating(true);
    setTranslateError('');
    try {
      const res = await questionAPI.translate({
        questionText: form.questionText.trim(),
        answers: answers.map((a) => a.text.trim()),
      });
      setSiQuestion(res.data.si.questionText);
      setSiAnswers(res.data.si.answers);
      setTaQuestion(res.data.ta.questionText);
      setTaAnswers(res.data.ta.answers);
      setTranslationDone(true);
    } catch {
      setTranslateError('Translation failed. You can save in English only, or try again.');
      setTranslationDone(false);
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.lesson || !form.difficulty || !form.questionText.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const filledAnswers = answers.filter((a) => a.text.trim());
    if (filledAnswers.length < 2) {
      setError('Please provide at least 2 answers.');
      return;
    }

    const hasCorrect = filledAnswers.some((a) => a.isCorrect);
    if (!hasCorrect) {
      setError('Please mark one answer as correct.');
      return;
    }

    if (isSuperAdmin && !form.grade) {
      setError('Please select a grade.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lesson: form.lesson,
        difficulty: form.difficulty,
        questionText: {
          en: form.questionText.trim(),
          si: siQuestion,
          ta: taQuestion,
        },
        answers: filledAnswers.map((a, idx) => ({
          text: {
            en: a.text.trim(),
            si: siAnswers[idx] || '',
            ta: taAnswers[idx] || '',
          },
          isCorrect: a.isCorrect,
        })),
      };
      if (isSuperAdmin) payload.grade = Number(form.grade);
      await questionAPI.create(payload);
      setSuccess('Question created successfully!');
      setForm({ lesson: '', difficulty: '', questionText: '', grade: isSuperAdmin ? '' : userGradeNumber });
      setAnswers([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      setSiQuestion('');
      setSiAnswers([]);
      setTaQuestion('');
      setTaAnswers([]);
      setTranslationDone(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question.');
    } finally {
      setLoading(false);
    }
  };

  const answerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Create New Question</h2>
          <p>Add a multiple-choice question to the question bank</p>
        </div>

        <div className="section">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Grade</label>
                {isSuperAdmin ? (
                  <select
                    name="grade"
                    value={form.grade}
                    onChange={handleFormChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select grade...</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                ) : (
                  <div className="form-static">
                    {userGradeNumber ? `Grade ${userGradeNumber}` : 'No grade assigned'}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Lesson *</label>
                <select
                  name="lesson"
                  value={form.lesson}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                >
                  <option value="">Select lesson...</option>
                  {LESSONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Difficulty *</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                >
                  <option value="">Select difficulty...</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Question Text *</label>
              <textarea
                name="questionText"
                value={form.questionText}
                onChange={handleFormChange}
                placeholder="Enter your question here... (supports math symbols like π, °, cm²)"
                rows={4}
                className="form-textarea"
                required
              />
            </div>

            <div className="answers-section">
              <div className="answers-header">
                <label>Answer Options *</label>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={addAnswer}
                >
                  + Add Answer
                </button>
              </div>
              <p className="answers-hint">Select the radio button next to the correct answer</p>

              {answers.map((ans, idx) => (
                <div key={idx} className="answer-row">
                  <label className="answer-radio">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={ans.isCorrect}
                      onChange={() => handleCorrectChange(idx)}
                    />
                    <span className="answer-label">{answerLabels[idx]}</span>
                  </label>
                  <input
                    type="text"
                    value={ans.text}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder={`Answer ${answerLabels[idx]}`}
                    className="answer-input"
                  />
                  {answers.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeAnswer(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Translate button */}
            <div style={{ margin: '16px 0' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleTranslate}
                disabled={!canTranslate || translating}
              >
                {translating ? 'Translating...' : '🌐 Translate to Sinhala & Tamil'}
              </button>
              {translateError && (
                <p style={{ color: '#e53e3e', fontSize: '0.875rem', marginTop: '6px' }}>
                  {translateError}
                </p>
              )}
            </div>

            {/* Translation sections */}
            {translationDone && (
              <>
                {/* Sinhala section */}
                <div style={{ border: '1px solid #d6bcfa', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#faf5ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong>සිංහල (Sinhala)</strong>
                    <span style={{ fontSize: '0.75rem', background: '#6b46c1', color: '#fff', padding: '2px 8px', borderRadius: '9999px' }}>✨ AI Generated</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#718096', margin: '0 0 12px' }}>You can edit before saving</p>
                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea
                      value={siQuestion}
                      onChange={(e) => setSiQuestion(e.target.value)}
                      rows={3}
                      className="form-textarea"
                    />
                  </div>
                  {answers.map((_, idx) => (
                    <div key={idx} className="form-group">
                      <label>Answer {answerLabels[idx]}</label>
                      <input
                        type="text"
                        value={siAnswers[idx] || ''}
                        onChange={(e) => {
                          const updated = [...siAnswers];
                          updated[idx] = e.target.value;
                          setSiAnswers(updated);
                        }}
                        className="answer-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleTranslate}
                    disabled={translating}
                  >
                    🔄 Retranslate
                  </button>
                </div>

                {/* Tamil section */}
                <div style={{ border: '1px solid #fbd38d', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fffaf0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong>தமிழ் (Tamil)</strong>
                    <span style={{ fontSize: '0.75rem', background: '#c05621', color: '#fff', padding: '2px 8px', borderRadius: '9999px' }}>✨ AI Generated</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#718096', margin: '0 0 12px' }}>You can edit before saving</p>
                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea
                      value={taQuestion}
                      onChange={(e) => setTaQuestion(e.target.value)}
                      rows={3}
                      className="form-textarea"
                    />
                  </div>
                  {answers.map((_, idx) => (
                    <div key={idx} className="form-group">
                      <label>Answer {answerLabels[idx]}</label>
                      <input
                        type="text"
                        value={taAnswers[idx] || ''}
                        onChange={(e) => {
                          const updated = [...taAnswers];
                          updated[idx] = e.target.value;
                          setTaAnswers(updated);
                        }}
                        className="answer-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Creating...' : 'Create Question'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestion;
