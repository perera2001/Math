import React, { useState, useEffect } from 'react';
import { questionAPI } from '../services/api';
import Modal from './Modal';
import EditQuestion from './EditQuestion';

const DIFFICULTY_COLORS = {
  Easy: 'badge-easy',
  Medium: 'badge-medium',
  Hard: 'badge-hard',
};

const QuestionList = ({ isOpen, onClose, lesson, onStatsUpdate }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await questionAPI.getAll({ lesson });
      setQuestions(res.data.questions);
    } catch (err) {
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && lesson) {
      fetchQuestions();
    }
  }, [isOpen, lesson]);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await questionAPI.delete(id);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setDeleteConfirm(null);
      if (onStatsUpdate) onStatsUpdate();
    } catch (err) {
      setError('Failed to delete question.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSave = () => {
    setEditingQuestion(null);
    fetchQuestions();
    if (onStatsUpdate) onStatsUpdate();
  };

  const groupedByDifficulty = {
    Easy: questions.filter((q) => q.difficulty === 'Easy'),
    Medium: questions.filter((q) => q.difficulty === 'Medium'),
    Hard: questions.filter((q) => q.difficulty === 'Hard'),
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`${lesson} Questions`}>
        {loading ? (
          <div className="loading-text">Loading questions...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : questions.length === 0 ? (
          <div className="empty-state">No questions found for {lesson}.</div>
        ) : (
          <div className="question-list">
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              groupedByDifficulty[diff].length > 0 && (
                <div key={diff} className="difficulty-group">
                  <h4 className={`difficulty-title ${DIFFICULTY_COLORS[diff]}`}>
                    {diff} ({groupedByDifficulty[diff].length})
                  </h4>
                  {groupedByDifficulty[diff].map((q) => (
                    <div key={q._id} className="question-item">
                      <div className="question-content">
                        <p className="question-text">
                          {q.questionText.length > 100
                            ? q.questionText.substring(0, 100) + '...'
                            : q.questionText}
                        </p>
                        <div className="question-meta">
                          <span className={`badge ${DIFFICULTY_COLORS[q.difficulty]}`}>
                            {q.difficulty}
                          </span>
                          <span className="answer-count">{q.answers.length} answers</span>
                        </div>
                      </div>
                      <div className="question-actions">
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => setEditingQuestion(q)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeleteConfirm(q._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        )}

        {deleteConfirm && (
          <div className="confirm-overlay nested">
            <div className="confirm-dialog">
              <p>Are you sure you want to delete this question?</p>
              <div className="confirm-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {editingQuestion && (
        <EditQuestion
          isOpen={!!editingQuestion}
          onClose={() => setEditingQuestion(null)}
          question={editingQuestion}
          onSave={handleEditSave}
        />
      )}
    </>
  );
};

export default QuestionList;
