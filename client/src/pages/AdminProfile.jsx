import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const GRADE_LABEL = {
  GRADE_9: 'Grade 9',
  GRADE_10: 'Grade 10',
  GRADE_11: 'Grade 11',
};

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // ── Load profile from API ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await userAPI.getProfile();
        const data = res.data.user;
        setProfile(data);
        setForm({ name: data.name, email: data.email, password: '', confirmPassword: '' });
      } catch {
        setLoadError('Failed to load profile. Please try again.');
        // Fall back to JWT data
        setProfile(user);
        setForm({ name: user.name, email: user.email, password: '', confirmPassword: '' });
      }
    };
    load();
  }, [user]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEdit = () => {
    setSaveError('');
    setSaveSuccess('');
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({ name: profile.name, email: profile.email, password: '', confirmPassword: '' });
    setSaveError('');
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (form.password && form.password !== form.confirmPassword) {
      return setSaveError('Passwords do not match');
    }
    if (form.password && form.password.length < 6) {
      return setSaveError('Password must be at least 6 characters');
    }

    const payload = {};
    if (form.name !== profile.name) payload.name = form.name;
    if (form.email !== profile.email) payload.email = form.email;
    if (form.password) payload.password = form.password;

    if (Object.keys(payload).length === 0) {
      return setSaveError('No changes detected');
    }

    setSaving(true);
    try {
      const res = await userAPI.updateProfile(payload);
      const updated = res.data.user;
      setProfile(updated);
      setForm({ name: updated.name, email: updated.email, password: '', confirmPassword: '' });
      updateUser(updated);        // keep AuthContext + localStorage in sync
      setSaveSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const data = profile || user;
  const initial = data?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="profile-page">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="profile-page-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2>My Profile</h2>
      </div>

      <div className="profile-page-body">
        {loadError && <div className="alert alert-error">{loadError}</div>}

        {/* ── Profile Card ────────────────────────────────────────────── */}
        <div className="profile-hero-card">
          <div className="profile-hero-avatar">{initial}</div>
          <div className="profile-hero-info">
            <h3>{data?.name}</h3>
            <p>{data?.email}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <span className="role-badge role-admin">Year Coordinator</span>
              {data?.grade && (
                <span className="role-badge role-admin" style={{ background: '#ede9fe', color: '#5b21b6' }}>
                  {GRADE_LABEL[data.grade] || data.grade}
                </span>
              )}
            </div>
          </div>
          <div className="profile-hero-meta">
            <div className="meta-item">
              <span className="meta-label">Grade Assigned:</span>
              <span>{data?.grade ? GRADE_LABEL[data.grade] : '—'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Member since:</span>
              <span>{data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Details / Edit Card ─────────────────────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h3>Account Details</h3>
            {!editing && (
              <button className="btn btn-success" onClick={handleEdit}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {saveSuccess && <div className="alert alert-success">{saveSuccess}</div>}
          {saveError   && <div className="alert alert-error">{saveError}</div>}

          {!editing ? (
            /* ── Read-only view ───────────────────────────────────────── */
            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{data?.name}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{data?.email}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Password</span>
                <span className="detail-value" style={{ letterSpacing: '0.2em' }}>••••••••</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Grade</span>
                <span className="detail-value">
                  {data?.grade ? GRADE_LABEL[data.grade] : '—'}
                  <span style={{ color: '#9ca3af', fontSize: '0.78rem', marginLeft: '0.4rem' }}>
                    (cannot be changed)
                  </span>
                </span>
              </div>
            </div>
          ) : (
            /* ── Edit form ─────────────────────────────────────────────── */
            <form onSubmit={handleSave} className="form-card">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">New Password <span style={{ color: '#9ca3af', fontWeight: 400 }}>(leave blank to keep current)</span></label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="New password (min. 6 characters)"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Grade</label>
                <input
                  type="text"
                  value={data?.grade ? GRADE_LABEL[data.grade] : '—'}
                  disabled
                  style={{ background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#9ca3af', fontSize: '0.78rem' }}>Grade can only be changed by Super Admin</small>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving…' : '✓ Save Changes'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
