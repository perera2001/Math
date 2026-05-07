import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, questionAPI } from '../services/api';
import QuestionList from '../components/QuestionList';

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin Panel
// ─────────────────────────────────────────────────────────────────────────────
const SuperAdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', grade: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setListLoading(true);
    try {
      const res = await userAPI.getAllUsers();
      setUsers(res.data.users);
    } catch {
      setListError('Failed to load users. Please refresh.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdminFormChange = (e) =>
    setAdminForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await userAPI.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);
    try {
      await userAPI.createAdmin(adminForm);
      setFormSuccess('Year Coordinator account created successfully!');
      setAdminForm({ name: '', email: '', password: '', grade: '' });
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setFormLoading(false);
    }
  };

  const counts = {
    students: users.filter((u) => u.role === 'USER').length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    total: users.length,
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>👑 Super Admin Panel</h2>
        <p>Manage all users, admins, and platform settings</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{counts.students}</h3>
          <p>Students</p>
        </div>
        <div className="stat-card accent">
          <h3>{counts.admins}</h3>
          <p>Year Coordinators</p>
        </div>
        <div className="stat-card">
          <h3>{counts.total}</h3>
          <p>Total Users</p>
        </div>
      </div>

      {/* Create Admin Section */}
      <div className="section">
        <div className="section-header">
          <h3>Year Coordinators (Admins)</h3>
          <button
            className="btn btn-success"
            onClick={() => { setShowForm((p) => !p); setFormError(''); setFormSuccess(''); }}
          >
            {showForm ? '✕ Cancel' : '+ New Coordinator'}
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
            <form onSubmit={handleCreateAdmin}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={adminForm.name}
                    onChange={handleAdminFormChange}
                    placeholder="Coordinator name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={adminForm.email}
                    onChange={handleAdminFormChange}
                    placeholder="Coordinator email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={adminForm.password}
                    onChange={handleAdminFormChange}
                    placeholder="Temporary password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Assign Grade</label>
                  <select
                    name="grade"
                    value={adminForm.grade}
                    onChange={handleAdminFormChange}
                    required
                    style={{ width: '100%', padding: '0.7rem 1rem', border: '2px solid #e1e4e8', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#fff' }}
                  >
                    <option value="">-- Select Grade --</option>
                    <option value="GRADE_9">Grade 9</option>
                    <option value="GRADE_10">Grade 10</option>
                    <option value="GRADE_11">Grade 11</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-success" disabled={formLoading}>
                {formLoading ? 'Creating…' : 'Create Coordinator'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* All Users Table */}
      <div className="section">
        <h3>All Users</h3>
        {listLoading ? (
          <div className="loading-text">Loading users…</div>
        ) : listError ? (
          <div className="alert alert-error">{listError}</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users found.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Grade</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.grade
                        ? <span className="role-badge role-admin">{u.grade.replace('_', ' ')}</span>
                        : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          disabled={deletingId === u._id}
                        >
                          {deletingId === u._id ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin (Year Coordinator) Panel
// ─────────────────────────────────────────────────────────────────────────────
const GRADE_LABEL = { GRADE_9: 'Grade 9', GRADE_10: 'Grade 10', GRADE_11: 'Grade 11' };

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    Geometry: { Easy: 0, Medium: 0, Hard: 0, total: 0 },
    Algebra: { Easy: 0, Medium: 0, Hard: 0, total: 0 },
    Numbers: { Easy: 0, Medium: 0, Hard: 0, total: 0 },
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await questionAPI.getStats();
      setStats(res.data.stats);
    } catch {
      // Stats loading failed silently
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await userAPI.getStudents();
        setStudents(res.data.students);
      } catch {
        setError('Failed to load students. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
    fetchStats();
  }, []);

  const lessonConfig = {
    Geometry: { icon: '📐', color: 'lesson-geometry' },
    Algebra: { icon: '🔢', color: 'lesson-algebra' },
    Numbers: { icon: '🔣', color: 'lesson-numbers' },
  };

  const totalQuestions = stats.Geometry.total + stats.Algebra.total + stats.Numbers.total;

  return (
    <div className="dashboard-content">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>👨‍🏫 {GRADE_LABEL[user?.grade] || 'Year Coordinator'} Dashboard</h2>
          <p>You are managing <strong>{GRADE_LABEL[user?.grade] || 'your grade'}</strong> · View students and question bank</p>
        </div>
        <button
          className="profile-icon-btn"
          onClick={() => navigate('/coordinator/profile')}
          title="View / Edit My Profile"
        >
          <span className="profile-icon-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
          <span className="profile-icon-label">My Profile</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{students.length}</h3>
          <p>Total Students</p>
        </div>
        <div className="stat-card accent">
          <h3>{totalQuestions}</h3>
          <p>Total Questions</p>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Question Bank</h3>
          <button
            className="btn btn-success"
            onClick={() => navigate('/coordinator/create-question')}
          >
            + Create Question
          </button>
        </div>

        {statsLoading ? (
          <div className="loading-text">Loading question bank...</div>
        ) : (
          <div className="lesson-grid">
            {Object.entries(lessonConfig).map(([lesson, config]) => (
              <div
                key={lesson}
                className={`lesson-card ${config.color}`}
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="lesson-icon">{config.icon}</div>
                <h4>{lesson}</h4>
                <div className="difficulty-counts">
                  <span className="count-easy">Easy: {stats[lesson].Easy}</span>
                  <span className="count-medium">Medium: {stats[lesson].Medium}</span>
                  <span className="count-hard">Hard: {stats[lesson].Hard}</span>
                </div>
                <div className="lesson-total">Total: {stats[lesson].total}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3>Student List</h3>
        {loading ? (
          <div className="loading-text">Loading students...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : students.length === 0 ? (
          <div className="empty-state">No students have registered yet.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.email}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuestionList
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lesson={selectedLesson}
        onStatsUpdate={fetchStats}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Student Panel
// ─────────────────────────────────────────────────────────────────────────────
const StudentPanel = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userAPI.getProfile();
        setProfile(res.data.user);
      } catch {
        // Fall back to data stored in AuthContext
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const data = profile || user;

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>🎓 Student Dashboard</h2>
        <p>Welcome back, {data?.name}!</p>
      </div>

      {loading ? (
        <div className="loading-text">Loading profile…</div>
      ) : (
        <div className="profile-card">
          <div className="profile-avatar">
            {data?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h3>{data?.name}</h3>
            <p>{data?.email}</p>
            <span className="role-badge role-user">Student</span>
          </div>
          <div className="profile-meta">
            <div className="meta-item">
              <span className="meta-label">Member since:</span>
              <span>
                {data?.createdAt
                  ? new Date(data.createdAt).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h3>📝 My Quizzes</h3>
        <div className="coming-soon-card">
          <p>🔜 Quizzes coming soon!</p>
          <p>Your assigned math quizzes will appear here. Stay tuned!</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Router (picks panel based on role)
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="dashboard">
      {user.role === 'SUPER_ADMIN' && <SuperAdminPanel />}
      {user.role === 'ADMIN' && <AdminPanel />}
      {user.role === 'USER' && <StudentPanel />}
    </div>
  );
};

export default Dashboard;
