import React, { useState, useEffect } from 'react';
import { questionAPI } from '../services/api';
import Modal from './Modal';

const LESSONS = ['Geometry', 'Algebra', 'Numbers'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Handle both old (string) and new (object) formats
const getEnText = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.en || '';
};
const getLangText = (val, lang) => {
  if (!val || typeof val === 'string') return '';
  return val[lang] || '';
};

const EditQuestion = ({ isOpen, onClose, question, onSave }) => {
  const [form, setForm] = useState({
    lesson: '',
    difficulty: '',
    questionText: '',
  });
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  const [siQuestion, setSiQuestion] = useState('');
  const [siAnswers, setSiAnswers] = useState([]);
  const [taQuestion, setTaQuestion] = useState('');
  const [taAnswers, setTaAnswers] = useState([]);
  const [showTranslations, setShowTranslations] = useState(false);

  useEffect(() => {
    if (question) {
      setForm({
        lesson: question.lesson,
        difficulty: question.difficulty,
        questionText: getEnText(question.questionText),
      });
      setAnswers(
        question.answers.map((a) => ({
          text: getEnText(a.text),
          isCorrect: a.isCorrect,
        }))
      );
      const si = getLangText(question.questionText, 'si');
      const ta = getLangText(question.questionText, 'ta');
      setSiQuestion(si);
      setTaQuestion(ta);
      setSiAnswers(question.answers.map((a) => getLangText(a.text, 'si')));
      setTaAnswers(question.answers.map((a) => getLangText(a.text, 'ta')));
      const hasTranslations = si || ta;
      setShowTranslations(!!hasTranslations);
    }
  }, [question]);

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
      setShowTranslations(true);
    } catch {
      setTranslateError('Translation failed. You can save in English only, or try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

    setLoading(true);
    try {
      await questionAPI.update(question._id, {
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
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update question.');
    } finally {
      setLoading(false);
    }
  };

  const answerLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Question">
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Lesson</label>
            <select
              name="lesson"
              value={form.lesson}
              onChange={handleFormChange}
              className="form-select"
            >
              {LESSONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleFormChange}
              className="form-select"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Question Text</label>
          <textarea
            name="questionText"
            value={form.questionText}
            onChange={handleFormChange}
            rows={4}
            className="form-textarea"
          />
        </div>

        <div className="answers-section">
          <div className="answers-header">
            <label>Answer Options</label>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addAnswer}
            >
              + Add Answer
            </button>
          </div>

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

        {/* Translate / expand translations */}
        <div style={{ margin: '16px 0' }}>
          {!showTranslations ? (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setShowTranslations(true);
                if (!siQuestion && !taQuestion) handleTranslate();
              }}
              disabled={!canTranslate || translating}
            >
              {translating ? 'Translating...' : '🌐 Add Translations'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleTranslate}
              disabled={!canTranslate || translating}
            >
              {translating ? 'Translating...' : '🔄 Retranslate'}
            </button>
          )}
          {translateError && (
            <p style={{ color: '#e53e3e', fontSize: '0.875rem', marginTop: '6px' }}>
              {translateError}
            </p>
          )}
        </div>

        {showTranslations && (
          <>
            {/* Sinhala */}
            <div style={{ border: '1px solid #d6bcfa', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#faf5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong>සිංහල (Sinhala)</strong>
                {siQuestion && (
                  <span style={{ fontSize: '0.75rem', background: '#6b46c1', color: '#fff', padding: '2px 8px', borderRadius: '9999px' }}>✨ AI Generated</span>
                )}
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
            </div>

            {/* Tamil */}
            <div style={{ border: '1px solid #fbd38d', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fffaf0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong>தமிழ் (Tamil)</strong>
                {taQuestion && (
                  <span style={{ fontSize: '0.75rem', background: '#c05621', color: '#fff', padding: '2px 8px', borderRadius: '9999px' }}>✨ AI Generated</span>
                )}
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
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditQuestion;
