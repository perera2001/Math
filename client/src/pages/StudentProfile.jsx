import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import { quizAPI } from "../api/quizApi";
import { useUILang } from "../context/UILanguageContext";

const StudentProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useUILang();

  const [profile, setProfile]   = useState(null);
  const [loadError, setLoadError] = useState("");
  const [stats, setStats]       = useState(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Load profile + stats ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, statsRes] = await Promise.allSettled([
          userAPI.getProfile(),
          quizAPI.getStats(),
        ]);
        if (profRes.status === "fulfilled") {
          const data = profRes.value.data.user;
          setProfile(data);
          setForm({ name: data.name, email: data.email, password: "", confirmPassword: "" });
        } else {
          setLoadError("Failed to load profile. Please try again.");
          setProfile(user);
          setForm({ name: user.name, email: user.email, password: "", confirmPassword: "" });
        }
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data.stats);
        }
      } catch {
        setLoadError("Failed to load profile. Please try again.");
      }
    };
    load();
  }, [user]);

  const handleChange  = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEdit    = () => { setSaveError(""); setSaveSuccess(""); setEditing(true); };
  const handleCancel  = () => {
    setForm({ name: profile.name, email: profile.email, password: "", confirmPassword: "" });
    setSaveError(""); setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(""); setSaveSuccess("");
    if (form.password && form.password !== form.confirmPassword)
      return setSaveError("Passwords do not match");
    if (form.password && form.password.length < 6)
      return setSaveError("Password must be at least 6 characters");

    const payload = {};
    if (form.name  !== profile.name)  payload.name  = form.name;
    if (form.email !== profile.email) payload.email = form.email;
    if (form.password) payload.password = form.password;
    if (Object.keys(payload).length === 0) return setSaveError("No changes detected");

    setSaving(true);
    try {
      const res     = await userAPI.updateProfile(payload);
      const updated = res.data.user;
      setProfile(updated);
      setForm({ name: updated.name, email: updated.email, password: "", confirmPassword: "" });
      updateUser(updated);
      setSaveSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true); setDeleteError("");
    try {
      await userAPI.deleteSelf();
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  const data    = profile || user;
  const initial = data?.name?.charAt(0).toUpperCase() || "?";

  const statChips = [
    { icon: "⭐", label: "Total Stars",    value: stats?.totalStars      ?? "—", accent: "sp-chip-gold"  },
    { icon: "🎯", label: "Quizzes Played", value: stats?.totalQuizzes    ?? "—", accent: "sp-chip-blue"  },
    { icon: "💯", label: "Total Score",    value: stats?.totalScore      ?? "—", accent: "sp-chip-cyan"  },
    { icon: "🏆", label: "Perfect Quizzes",value: stats?.perfectQuizzes  ?? "—", accent: "sp-chip-terra" },
    { icon: "🔥", label: "Best Streak",    value: stats?.bestStreak      ?? "—", accent: "sp-chip-fire"  },
  ];

  const lessonCards = [
    { key: "Geometry", icon: "📐", accent: "sd-accent-blue",  iconCls: "sd-icon-blue"  },
    { key: "Algebra",  icon: "🔢", accent: "sd-accent-cyan",  iconCls: "sd-icon-cyan"  },
    { key: "Numbers",  icon: "🔣", accent: "sd-accent-pink",  iconCls: "sd-icon-pink"  },
  ];

  return (
    <div className="sd-page sp-page">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="sd-header">
        <div className="sd-welcome-text">
          <h1>👤 My Profile</h1>
          <p>Manage your account and track your performance</p>
        </div>
      </div>

      {loadError && <div className="sp-alert sp-alert-error">{loadError}</div>}

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <div className="sp-grid">

        {/* ─── HERO card ─────────────────────────────────────── [hero] */}
        <div className="sd-card sd-accent-teal sp-area-hero">
          <div className="sd-card-body sp-hero-body">
            <div className="sp-hero-avatar">
              {initial}
              <div className="sp-hero-avatar-ring" />
            </div>
            <div className="sp-hero-info">
              <h2 className="sp-hero-name">{data?.name}</h2>
              <p className="sp-hero-email">{data?.email}</p>
              <div className="sp-hero-badges">
                <span className="sp-badge sp-badge-student">🎓 Student</span>
                {data?.grade && (
                  <span className="sp-badge sp-badge-grade">📚 Grade {data.grade}</span>
                )}
              </div>
            </div>
            <div className="sp-hero-meta">
              <div className="sp-meta-item">
                <span className="sp-meta-label">Member since</span>
                <span className="sp-meta-value">
                  {data?.createdAt ? new Date(data.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
              <div className="sp-meta-item">
                <span className="sp-meta-label">Account type</span>
                <span className="sp-meta-value">Free student</span>
              </div>
            </div>
          </div>

          {/* Quick-stat chips */}
          <div className="sp-chip-bar">
            {statChips.map(({ icon, label, value, accent }) => (
              <div key={label} className={`sp-chip ${accent}`}>
                <span className="sp-chip-icon">{icon}</span>
                <span className="sp-chip-value">{value}</span>
                <span className="sp-chip-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── ACCOUNT DETAILS card ──────────────────────── [details] */}
        <div className="sd-card sd-accent-blue sp-area-details">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-blue">✏️</div>
            <div>
              <div className="sd-card-title">Account Details</div>
              <div className="sd-card-subtitle">Update your name, email or password</div>
            </div>
            {!editing && (
              <button className="sp-edit-btn" onClick={handleEdit}>Edit</button>
            )}
          </div>

          <div className="sd-card-body">
            {saveSuccess && <div className="sp-alert sp-alert-success">{saveSuccess}</div>}
            {saveError   && <div className="sp-alert sp-alert-error">{saveError}</div>}

            {!editing ? (
              <div className="sp-detail-list">
                <div className="sp-detail-row">
                  <span className="sp-detail-icon">👤</span>
                  <div className="sp-detail-body">
                    <span className="sp-detail-label">Full Name</span>
                    <span className="sp-detail-value">{data?.name}</span>
                  </div>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-detail-icon">📧</span>
                  <div className="sp-detail-body">
                    <span className="sp-detail-label">Email Address</span>
                    <span className="sp-detail-value">{data?.email}</span>
                  </div>
                </div>
                <div className="sp-detail-row">
                  <span className="sp-detail-icon">🔑</span>
                  <div className="sp-detail-body">
                    <span className="sp-detail-label">Password</span>
                    <span className="sp-detail-value" style={{ letterSpacing: "0.25em" }}>••••••••</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="sp-form">
                <div className="sp-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input id="name" type="text" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="sp-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="sp-form-row">
                  <div className="sp-form-group">
                    <label htmlFor="password">New Password <span className="sp-label-muted">(leave blank to keep current)</span></label>
                    <input id="password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="New password" autoComplete="new-password" />
                  </div>
                  <div className="sp-form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input id="confirmPassword" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" autoComplete="new-password" />
                  </div>
                </div>
                <div className="sp-form-actions">
                  <button type="submit" className="sp-btn sp-btn-save" disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button type="button" className="sp-btn sp-btn-cancel" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ─── SUBJECT STATS card ──────────────────────────── [stats] */}
        <div className="sd-card sd-accent-cyan sp-area-stats">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sd-icon-cyan">📊</div>
            <div>
              <div className="sd-card-title">Subject Performance</div>
              <div className="sd-card-subtitle">Stars earned per topic</div>
            </div>
          </div>
          <div className="sd-card-body">
            {lessonCards.map(({ key, icon, accent, iconCls }) => {
              const ls     = stats?.byLesson?.[key];
              const played = ls?.played ?? 0;
              const stars  = ls?.stars  ?? 0;
              const maxStars = played * 3 || 1;
              const pct    = Math.min(100, Math.round((stars / maxStars) * 100));
              return (
                <div key={key} className="sp-subject-row">
                  <div className="sp-subject-icon-wrap">
                    <span className={`sp-subject-icon ${iconCls}`}>{icon}</span>
                  </div>
                  <div className="sp-subject-body">
                    <div className="sp-subject-top">
                      <span className="sp-subject-name">{key}</span>
                      <span className="sp-subject-played">{played} quiz{played !== 1 ? "zes" : ""}</span>
                    </div>
                    <div className="sp-bar-track">
                      <div
                        className={`sp-bar-fill ${accent.replace("sd-accent-", "sp-fill-")}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="sp-subject-stars">
                      {[1,2,3].map((n) => (
                        <span key={n} className={`sp-star${stars >= n ? " sp-star-on" : ""}`}>★</span>
                      ))}
                      <span className="sp-star-count">{stars} stars</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── DANGER ZONE card ──────────────────────────── [danger] */}
        <div className="sd-card sp-area-danger sp-danger-card">
          <div className="sd-card-header">
            <div className="sd-card-header-icon sp-icon-danger">⚠️</div>
            <div>
              <div className="sd-card-title sp-danger-title">Danger Zone</div>
              <div className="sd-card-subtitle">Irreversible account actions</div>
            </div>
          </div>
          <div className="sd-card-body">
            <p className="sp-danger-desc">
              Permanently delete your account and all associated quiz data. This action cannot be undone.
            </p>

            {deleteError && <div className="sp-alert sp-alert-error">{deleteError}</div>}

            {!showDeleteConfirm ? (
              <button className="sp-btn sp-btn-delete" onClick={() => { setShowDeleteConfirm(true); setDeleteError(""); }}>
                🗑 Delete My Account
              </button>
            ) : (
              <div className="sp-delete-confirm">
                <p className="sp-delete-confirm-q">Are you absolutely sure? All your data will be lost.</p>
                <div className="sp-form-actions">
                  <button className="sp-btn sp-btn-delete" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting…" : "Yes, Delete Account"}
                  </button>
                  <button className="sp-btn sp-btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentProfile;

