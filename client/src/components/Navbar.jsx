import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUILang } from "../context/UILanguageContext";
import { LoginModal, RegisterModal } from "./AuthModals";

/* ── Student-specific top navigation bar ─────────────────────────── */
const StudentNavbar = ({ user, onLogout, t, uiLang, switchLang }) => {
  const location = useLocation();
  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  const navItems = [
    { path: "/student/dashboard", icon: "⊞", label: t("nav_dashboard") },
    { path: "/student/quiz/setup", icon: "▶", label: t("nav_play_game") },
    { path: "/student/leaderboard", icon: "🏆", label: "Leaderboard" },
    { path: "/student/profile", icon: "👤", label: t("nav_profile") },
  ];

  return (
    <nav className="student-navbar">
      {/* Brand */}
      <div className="snav-brand">
        <div className="snav-logo">🧮</div>
        <span className="snav-brand-text">MathsApp</span>
      </div>

      {/* Center navigation links */}
      <div className="snav-links">
        {navItems.map(({ path, icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`snav-link${location.pathname === path ? " active" : ""}`}
          >
            <span className="snav-link-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </div>

      {/* Right side: lang + user + logout */}
      <div className="snav-right">
        <div className="snav-lang">
          {[
            ["en", "EN"],
            ["si", "සිං"],
            ["ta", "த"],
          ].map(([code, label]) => (
            <button
              key={code}
              onClick={() => switchLang(code)}
              className={`snav-lang-btn${uiLang === code ? " active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="snav-divider" />

        <div className="snav-user">
          <div className="snav-avatar">{initial}</div>
          <span className="snav-name">{user?.name?.split(" ")[0]}</span>
        </div>

        <button onClick={onLogout} className="snav-logout">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t("nav_logout")}
        </button>
      </div>
    </nav>
  );
};

/* ── Main Navbar (admin / public routes) ─────────────────────────── */
const Navbar = () => {
  const { user, logout } = useAuth();
  const { uiLang, switchLang, t } = useUILang();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // null | "login" | "register"

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const closeModal = () => setModal(null);

  /* Render student navbar for USER role */
  if (user?.role === "USER") {
    return (
      <StudentNavbar
        user={user}
        onLogout={handleLogout}
        t={t}
        uiLang={uiLang}
        switchLang={switchLang}
      />
    );
  }

  const roleLabel = {
    SUPER_ADMIN: "👑 Super Admin",
    ADMIN: "👨‍🏫 Year Coordinator",
  };

  const langBtn = (code, label) => (
    <button
      key={code}
      onClick={() => switchLang(code)}
      style={{
        padding: "0.25rem 0.6rem",
        borderRadius: "6px",
        border:
          uiLang === code
            ? "2px solid var(--primary)"
            : "1px solid rgba(255,255,255,0.3)",
        background:
          uiLang === code ? "var(--primary)" : "rgba(255,255,255,0.08)",
        color: "#fff",
        fontWeight: uiLang === code ? 700 : 400,
        fontSize: "0.78rem",
        cursor: "pointer",
        transition: "all 0.15s",
        lineHeight: 1.4,
        opacity: uiLang === code ? 1 : 0.75,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">{t("nav_brand")}</div>

        <div className="navbar-links">
          {/* Language switcher */}
          <div
            style={{ display: "flex", gap: "0.35rem", marginRight: "0.4rem" }}
          >
            {langBtn("en", "EN")}
            {langBtn("si", "සිං")}
            {langBtn("ta", "த")}
          </div>

          {user ? (
            <>
              {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                <Link to="/dashboard">{t("nav_dashboard")}</Link>
              )}
              <span className="user-chip">
                {roleLabel[user.role] || user.role} · {user.name}
              </span>
              <button onClick={handleLogout} className="btn btn-danger">
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setModal("login")}
                style={{ cursor: "pointer" }}
              >
                {t("nav_login")}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setModal("register")}
                style={{ cursor: "pointer" }}
              >
                {t("nav_register")}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Auth modals */}
      {modal === "login" && (
        <LoginModal
          onClose={closeModal}
          onSwitchToRegister={() => setModal("register")}
        />
      )}
      {modal === "register" && (
        <RegisterModal
          onClose={closeModal}
          onSwitchToLogin={() => setModal("login")}
        />
      )}
    </>
  );
};

export default Navbar;
