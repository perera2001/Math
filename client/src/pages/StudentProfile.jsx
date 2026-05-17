import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import { quizAPI } from "../api/quizApi";
import { useUILang } from "../context/UILanguageContext";
import RankBadge, { getRankLabel, getStarsPerTier, RANK_GRADIENTS, RANK_ACCENT, LEGENDARY_SAGE_INDEX } from "../components/RankBadge";

const StudentProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useUILang();

  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [stats, setStats] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
          setForm({
            name: data.name,
            email: data.email,
            password: "",
            confirmPassword: "",
          });
        } else {
          setLoadError("Failed to load profile. Please try again.");
          setProfile(user);
          setForm({
            name: user.name,
            email: user.email,
            password: "",
            confirmPassword: "",
          });
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

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEdit = () => {
    setSaveError("");
    setSaveSuccess("");
    setEditing(true);
  };
  const handleCancel = () => {
    setForm({
      name: profile.name,
      email: profile.email,
      password: "",
      confirmPassword: "",
    });
    setSaveError("");
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");
    if (form.password && form.password !== form.confirmPassword)
      return setSaveError("Passwords do not match");
    if (form.password && form.password.length < 6)
      return setSaveError("Password must be at least 6 characters");

    const payload = {};
    if (form.name !== profile.name) payload.name = form.name;
    if (form.email !== profile.email) payload.email = form.email;
    if (form.password) payload.password = form.password;
    if (Object.keys(payload).length === 0)
      return setSaveError("No changes detected");

    setSaving(true);
    try {
      const res = await userAPI.updateProfile(payload);
      const updated = res.data.user;
      setProfile(updated);
      setForm({
        name: updated.name,
        email: updated.email,
        password: "",
        confirmPassword: "",
      });
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
    setDeleting(true);
    setDeleteError("");
    try {
      await userAPI.deleteSelf();
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          "Failed to delete account. Please try again.",
      );
      setDeleting(false);
    }
  };

  const data = profile || user;
  const initial = data?.name?.charAt(0).toUpperCase() || "?";

  // Rank-related derived values
  const rankIdx  = stats?.rankIndex ?? 0;
  const rankTier = stats?.tier ?? 3;
  const starsIT  = stats?.starsInTier ?? 0;
  const spp      = stats?.starProtectionPoints ?? 0;
  const sbp      = stats?.starBonusPoints ?? 0;
  const coins    = stats?.coins ?? 0;
  const profLvl  = stats?.profileLevel ?? 1;
  const profXP   = stats?.profileXP ?? 0;
  const accentC  = RANK_ACCENT[Math.min(rankIdx, LEGENDARY_SAGE_INDEX)] ?? "#22c55e";
  const spt      = getStarsPerTier(rankIdx);

  // XP bar: xpForLevel(N) = 100 + (N-1)*150; cumulative = sum(1..N-1)
  const xpForLevel = (n) => 100 + (n - 1) * 150;
  const xpToNext   = xpForLevel(profLvl + 1);
  const xpInLevel  = Math.max(0, profXP - Array.from({ length: profLvl - 1 }, (_, i) => xpForLevel(i + 1)).reduce((a, b) => a + b, 0));
  const xpPct      = Math.min(100, Math.round((xpInLevel / xpToNext) * 100));

  const RANK_NAMES = ["Beginner","Learner","Apprentice","Skilled","Expert","Master","Grandmaster","Mythic","Legend","Legendary Sage"];

  const statChips = [
    {
      icon: "⭐",
      label: "Total Stars",
      value: stats?.totalStars ?? "—",
      accent: "sp-chip-gold",
    },
    {
      icon: "🎯",
      label: "Quizzes Played",
      value: stats?.totalQuizzes ?? "—",
      accent: "sp-chip-blue",
    },
    {
      icon: "💯",
      label: "Total Score",
      value: stats?.totalScore ?? "—",
      accent: "sp-chip-cyan",
    },
    {
      icon: "🏆",
      label: "Perfect Quizzes",
      value: stats?.perfectQuizzes ?? "—",
      accent: "sp-chip-terra",
    },
    {
      icon: "🔥",
      label: "Best Streak",
      value: stats?.bestStreak ?? "—",
      accent: "sp-chip-fire",
    },
  ];

  const lessonCards = [
    {
      key: "Geometry",
      icon: "📐",
      accent: "sd-accent-blue",
      iconCls: "sd-icon-blue",
    },
    {
      key: "Algebra",
      icon: "🔢",
      accent: "sd-accent-cyan",
      iconCls: "sd-icon-cyan",
    },
    {
      key: "Numbers",
      icon: "🔣",
      accent: "sd-accent-pink",
      iconCls: "sd-icon-pink",
    },
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

      {/* ── RANK HERO CARD ─────────────────────────────────────────── */}
      <style>{`
        /* Spinning border frame for active rank box */
        @keyframes spin-frame{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        /* Card shine sweep */
        @keyframes cardShine{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
      `}</style>

      <div style={{
        background: "linear-gradient(135deg, #1c2240 0%, #242d55 25%, #1a2040 50%, #22294e 75%, #1c2240 100%)",
        borderRadius: 20,
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: `0 4px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.06)`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Left accent bar */}
        <div style={{
          position:"absolute", left:0, top:0, bottom:0, width:5,
          background: RANK_GRADIENTS[Math.min(rankIdx, LEGENDARY_SAGE_INDEX)],
          borderRadius:"20px 0 0 20px",
        }}/>
        {/* Rank-colour top-left glow */}
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 55% 45% at 8% 0%,${accentC}20 0%,transparent 65%)` }}/>
        {/* Animated diagonal shine stripe */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, bottom:0,
          pointerEvents:"none", overflow:"hidden",
        }}>
          <div style={{
            position:"absolute", top:"-50%", width:"35%", height:"200%",
            background:"linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.055) 50%,transparent 60%)",
            animation:"cardShine 4s ease-in-out infinite",
          }}/>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap", position:"relative", zIndex:1 }}>

          {/* Rank badge */}
          <RankBadge rankIndex={rankIdx} tier={rankTier} starsInTier={starsIT} size="lg" />

          {/* Rank name + stars + SPP/SBP/Coins */}
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontWeight:900, fontSize:"1.6rem", color:"#f1f5f9", letterSpacing:1, lineHeight:1.2 }}>
              {getRankLabel(rankIdx, rankTier)}
            </div>
            <div style={{ color:"#94a3b8", fontSize:"0.85rem", marginBottom:"0.7rem", fontWeight:500 }}>
              {starsIT} / {spt} stars in tier
            </div>
            <div style={{ display:"flex", gap:"1.2rem", flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:"0.7rem",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:"0.25rem" }}>Protection</div>
                <div style={{ display:"flex",gap:3 }}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} style={{
                      display:"inline-flex",alignItems:"center",justifyContent:"center",
                      width:24,height:24,borderRadius:7,
                      background: i < spp ? "#1e3a8a" : "rgba(255,255,255,0.05)",
                      border:`1px solid ${i < spp ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                      fontSize:"0.9rem",
                      filter: i < spp ? "drop-shadow(0 0 5px #60a5fa)" : "grayscale(1) opacity(0.3)",
                    }}>🛡️</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:"0.7rem",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:"0.25rem" }}>Bonus</div>
                <div style={{ display:"flex",gap:3 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{
                      display:"inline-flex",alignItems:"center",justifyContent:"center",
                      width:24,height:24,borderRadius:7,
                      background: i < sbp ? "#3b0764" : "rgba(255,255,255,0.05)",
                      border:`1px solid ${i < sbp ? "#a855f7" : "rgba(255,255,255,0.1)"}`,
                      fontSize:"0.9rem",
                      filter: i < sbp ? "drop-shadow(0 0 5px #c084fc)" : "grayscale(1) opacity(0.3)",
                    }}>💎</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:"0.7rem",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:"0.25rem" }}>Coins</div>
                <div style={{
                  display:"inline-flex",alignItems:"center",gap:5,
                  background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.3)",
                  borderRadius:8,padding:"0.22rem 0.6rem",
                }}>
                  <span style={{ fontSize:"1rem" }}>🪙</span>
                  <span style={{ fontWeight:800,color:"#fde68a",fontSize:"1rem" }}>{coins}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile XP bar */}
          <div style={{ minWidth:200, flex:1 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"0.4rem" }}>
              <span style={{ fontWeight:800,color:"#f1f5f9",fontSize:"0.95rem" }}>Level {profLvl}</span>
              <span style={{ color:"#94a3b8",fontSize:"0.82rem",fontWeight:600 }}>{xpInLevel} / {xpToNext} XP</span>
            </div>
            <div style={{ height:10,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{
                height:"100%",width:`${xpPct}%`,
                background:`linear-gradient(90deg, ${accentC} 0%, #e2e8f0 100%)`,
                borderRadius:99,transition:"width 0.6s ease",
                minWidth: xpPct > 0 ? 8 : 0,
                boxShadow:`0 0 8px ${accentC}88`,
              }}/>
            </div>
            <div style={{ color:"#475569",fontSize:"0.75rem",marginTop:"0.3rem",textAlign:"right",fontWeight:500 }}>Profile XP</div>
          </div>
        </div>

        {/* ── Rank Ladder ── */}
        <div style={{ marginTop:"1.2rem",display:"flex",gap:"0.35rem",overflowX:"auto",paddingBottom:"0.2rem",position:"relative",zIndex:1 }}>
          {(() => {
            const BOX_BG  = ["#0d2e1a","#091c44","#1e0a4a","#3a1200","#35001a","#2a003a","#3a1800","#001c28","#280000","#12073a"];
            const BOX_DIM = ["#0a1e12","#060f28","#120530","#230b00","#220010","#1a0025","#250f00","#000f16","#180000","#0a0420"];
            const ICONS   = ["🌱","📖","⚒️","⚔️","🔬","🏛️","👑","🌀","🐉","✨"];
            // Unique conic-gradient pattern per rank — creates distinct spinning borders
            const FRAME_GRAD = [
              `conic-gradient(from 0deg,#22c55e 0%,#86efac 22%,transparent 38%,transparent 62%,#22c55e 78%,#86efac)`,
              `conic-gradient(from 0deg,#3b82f6 0%,#93c5fd 18%,transparent 38%,transparent 52%,#3b82f6 72%,#93c5fd 88%,transparent)`,
              `conic-gradient(from 0deg,#8b5cf6 0%,#c4b5fd 18%,transparent 42%,#a78bfa 58%,#8b5cf6 75%,#c4b5fd 90%,transparent)`,
              `conic-gradient(from 0deg,#f97316 0%,#fbbf24 8%,transparent 22%,#f97316 38%,#fbbf24 48%,transparent 62%,#f97316 75%,#fbbf24 85%,transparent)`,
              `conic-gradient(from 0deg,#ec4899 0%,#fbcfe8 12%,transparent 28%,transparent 38%,#ec4899 52%,#fbcfe8 62%,transparent 76%,transparent 86%,#ec4899 96%)`,
              `conic-gradient(from 0deg,#d946ef 0%,#a855f7 20%,transparent 42%,#d946ef 58%,#a855f7 78%,transparent)`,
              `conic-gradient(from 0deg,#f59e0b 0%,#fef08a 12%,#f59e0b 24%,transparent 40%,transparent 60%,#f59e0b 76%,#fef08a 88%,#f59e0b)`,
              `conic-gradient(from 0deg,#0ea5e9 0%,#7dd3fc 14%,transparent 30%,#38bdf8 46%,transparent 60%,#0ea5e9 74%,#7dd3fc 88%,transparent)`,
              `conic-gradient(from 0deg,#ef4444 0%,#fb923c 12%,transparent 28%,#ef4444 44%,#fb923c 56%,transparent 70%,#ef4444 84%,#fb923c 95%,transparent)`,
              `conic-gradient(from 0deg,#fbbf24,#4ade80 11%,#0ea5e9 22%,#8b5cf6 33%,#ec4899 44%,#ef4444 55%,#f97316 66%,#fbbf24 77%,#4ade80 88%,#0ea5e9)`,
            ];
            // Unique speed per rank
            const FRAME_SPD = ["2.5s","2s","1.8s","0.85s","1.4s","1.7s","2.8s","1.5s","1.1s","3s"];

            return RANK_NAMES.map((name, i) => {
              const isActive = i === rankIdx;
              const isPassed = i < rankIdx;
              const isFuture = i > rankIdx;

              const innerContent = (
                <>
                  <div style={{ fontSize:"1.15rem",marginBottom:"0.1rem" }}>{ICONS[i]}</div>
                  <div style={{
                    fontSize:"0.62rem",
                    color: isActive ? RANK_ACCENT[i] : isPassed ? `${RANK_ACCENT[i]}bb` : "#475569",
                    fontWeight: isActive ? 800 : isPassed ? 600 : 400,
                    whiteSpace:"nowrap",
                    letterSpacing: isActive ? 0.3 : 0,
                  }}>{name.split(" ")[0]}</div>
                  {isActive && (
                    <div style={{ width:5,height:5,borderRadius:"50%",background:RANK_ACCENT[i],margin:"0.2rem auto 0",boxShadow:`0 0 8px ${RANK_ACCENT[i]}` }}/>
                  )}
                </>
              );

              if (isActive) {
                // Spinning conic-gradient border frame ONLY on active box
                return (
                  <div key={name} style={{ position:"relative",borderRadius:14,padding:3,flexShrink:0,overflow:"hidden" }}>
                    {/* Spinning gradient ring */}
                    <div style={{
                      position:"absolute",top:"-100%",left:"-100%",
                      width:"300%",height:"300%",
                      background: FRAME_GRAD[i],
                      animation:`spin-frame ${FRAME_SPD[i]} linear infinite`,
                      transformOrigin:"center",
                    }}/>
                    {/* Content sits on top */}
                    <div style={{
                      position:"relative",zIndex:1,
                      minWidth:70,padding:"0.5rem 0.4rem",
                      borderRadius:11,textAlign:"center",
                      background:BOX_BG[i],
                    }}>
                      {innerContent}
                    </div>
                  </div>
                );
              }

              return (
                <div key={name} style={{
                  minWidth:70,padding:"0.5rem 0.4rem",borderRadius:12,textAlign:"center",
                  background: isPassed ? BOX_DIM[i] : BOX_DIM[i],
                  border: isPassed ? `1.5px solid ${RANK_ACCENT[i]}44` : "1.5px solid rgba(255,255,255,0.06)",
                  opacity: isFuture ? 0.38 : 1,
                  flexShrink:0,
                }}>
                  {innerContent}
                </div>
              );
            });
          })()}
        </div>
      </div>

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
                  <span className="sp-badge sp-badge-grade">
                    📚 Grade {data.grade}
                  </span>
                )}
              </div>
            </div>
            <div className="sp-hero-meta">
              <div className="sp-meta-item">
                <span className="sp-meta-label">Member since</span>
                <span className="sp-meta-value">
                  {data?.createdAt
                    ? new Date(data.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
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
              <div className="sd-card-subtitle">
                Update your name, email or password
              </div>
            </div>
            {!editing && (
              <button className="sp-edit-btn" onClick={handleEdit}>
                Edit
              </button>
            )}
          </div>

          <div className="sd-card-body">
            {saveSuccess && (
              <div className="sp-alert sp-alert-success">{saveSuccess}</div>
            )}
            {saveError && (
              <div className="sp-alert sp-alert-error">{saveError}</div>
            )}

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
                    <span
                      className="sp-detail-value"
                      style={{ letterSpacing: "0.25em" }}
                    >
                      ••••••••
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="sp-form">
                <div className="sp-form-group">
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
                <div className="sp-form-group">
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
                <div className="sp-form-row">
                  <div className="sp-form-group">
                    <label htmlFor="password">
                      New Password{" "}
                      <span className="sp-label-muted">
                        (leave blank to keep current)
                      </span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="New password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="sp-form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="sp-form-actions">
                  <button
                    type="submit"
                    className="sp-btn sp-btn-save"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="sp-btn sp-btn-cancel"
                    onClick={handleCancel}
                    disabled={saving}
                  >
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
              const ls = stats?.byLesson?.[key];
              const played = ls?.played ?? 0;
              const stars = ls?.stars ?? 0;
              const maxStars = played * 3 || 1;
              const pct = Math.min(100, Math.round((stars / maxStars) * 100));
              return (
                <div key={key} className="sp-subject-row">
                  <div className="sp-subject-icon-wrap">
                    <span className={`sp-subject-icon ${iconCls}`}>{icon}</span>
                  </div>
                  <div className="sp-subject-body">
                    <div className="sp-subject-top">
                      <span className="sp-subject-name">{key}</span>
                      <span className="sp-subject-played">
                        {played} quiz{played !== 1 ? "zes" : ""}
                      </span>
                    </div>
                    <div className="sp-bar-track">
                      <div
                        className={`sp-bar-fill ${accent.replace("sd-accent-", "sp-fill-")}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="sp-subject-stars">
                      {[1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className={`sp-star${stars >= n ? " sp-star-on" : ""}`}
                        >
                          ★
                        </span>
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
              <div className="sd-card-subtitle">
                Irreversible account actions
              </div>
            </div>
          </div>
          <div className="sd-card-body">
            <p className="sp-danger-desc">
              Permanently delete your account and all associated quiz data. This
              action cannot be undone.
            </p>

            {deleteError && (
              <div className="sp-alert sp-alert-error">{deleteError}</div>
            )}

            {!showDeleteConfirm ? (
              <button
                className="sp-btn sp-btn-delete"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteError("");
                }}
              >
                🗑 Delete My Account
              </button>
            ) : (
              <div className="sp-delete-confirm">
                <p className="sp-delete-confirm-q">
                  Are you absolutely sure? All your data will be lost.
                </p>
                <div className="sp-form-actions">
                  <button
                    className="sp-btn sp-btn-delete"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Yes, Delete Account"}
                  </button>
                  <button
                    className="sp-btn sp-btn-cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
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
