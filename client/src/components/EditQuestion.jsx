import React, { useState, useEffect } from 'react';
import { questionAPI } from '../services/api';
import Modal from './Modal';

const LESSONS = ['Geometry', 'Algebra', 'Numbers'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const EditQuestion = ({ isOpen, onClose, question, onSave }) => {
  const [form, setForm] = useState({
    lesson: '',
    difficulty: '',
    questionText: '',
  });
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setForm({
        lesson: question.lesson,
        difficulty: question.difficulty,
        questionText: question.questionText,
      });
      setAnswers(question.answers.map((a) => ({ ...a })));
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
        questionText: form.questionText,
        answers: filledAnswers,
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
