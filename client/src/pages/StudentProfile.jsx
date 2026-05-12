import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { useUILang } from '../context/UILanguageContext';

const StudentProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useUILang();

  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await userAPI.getProfile();
        const data = res.data.user;
        setProfile(data);
        setForm({ name: data.name, email: data.email, password: '', confirmPassword: '' });
      } catch {
        setLoadError('Failed to load profile. Please try again.');
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
      updateUser(updated);
      setSaveSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await userAPI.deleteSelf();
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  const data = profile || user;
  const initial = data?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="profile-page">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="profile-page-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          {t('profile_back')}
        </button>
        <h2>{t('profile_title')}</h2>
      </div>

      <div className="profile-page-body">
        {loadError && <div className="alert alert-error">{loadError}</div>}

        {/* ── Hero Card ───────────────────────────────────────────────── */}
        <div className="profile-hero-card">
          <div className="profile-hero-avatar">{initial}</div>
          <div className="profile-hero-info">
            <h3>{data?.name}</h3>
            <p>{data?.email}</p>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="role-badge role-user">{t('profile_student')}</span>
            </div>
          </div>
          <div className="profile-hero-meta">
            <div className="meta-item">
              <span className="meta-label">{t('profile_member_since')}</span>
              <span>{data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Details / Edit Card ─────────────────────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h3>{t('profile_account_details')}</h3>
            {!editing && (
              <button className="btn btn-success" onClick={handleEdit}>
                {t('profile_edit')}
              </button>
            )}
          </div>

          {saveSuccess && <div className="alert alert-success">{saveSuccess}</div>}
          {saveError   && <div className="alert alert-error">{saveError}</div>}

          {!editing ? (
            /* ── Read-only view ─────────────────────────────────────── */
            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="detail-label">{t('profile_full_name')}</span>
                <span className="detail-value">{data?.name}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">{t('profile_email')}</span>
                <span className="detail-value">{data?.email}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">{t('profile_password')}</span>
                <span className="detail-value" style={{ letterSpacing: '0.2em' }}>••••••••</span>
              </div>
            </div>
          ) : (
            /* ── Edit form ──────────────────────────────────────────── */
            <form onSubmit={handleSave} className="form-card">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">{t('profile_full_name')}</label>
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
                  <label htmlFor="email">{t('profile_email')}</label>
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
                  <label htmlFor="password">
                    {t('profile_new_password')}{' '}
                    <span style={{ color: '#9ca3af', fontWeight: 400 }}>({t('profile_keep_current')})</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t('profile_new_password_ph')}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">{t('profile_confirm_password')}</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('profile_confirm_ph')}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? t('profile_saving') : t('profile_save')}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                  {t('profile_cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <div className="section" style={{ borderTop: '2px solid #fee2e2', marginTop: '1.5rem' }}>
          <div className="section-header">
            <h3 style={{ color: '#dc2626' }}>{t('profile_danger_zone')}</h3>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            {t('profile_danger_desc')}
          </p>

          {deleteError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{deleteError}</div>}

          {!showDeleteConfirm ? (
            <button
              className="btn btn-danger"
              onClick={() => { setShowDeleteConfirm(true); setDeleteError(''); }}
            >
              {t('profile_delete_btn')}
            </button>
          ) : (
            <div className="form-card" style={{ background: '#fff5f5', border: '1px solid #fca5a5' }}>
              <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: '1rem' }}>
                {t('profile_delete_confirm_q')}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? t('profile_deleting') : t('profile_delete_yes')}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  {t('profile_delete_cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
