import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUILang } from '../context/UILanguageContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { uiLang, switchLang, t } = useUILang();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    SUPER_ADMIN: '👑 Super Admin',
    ADMIN: '👨‍🏫 Year Coordinator',
    USER: '🎓 Student',
  };

  const langBtn = (code, label) => (
    <button
      key={code}
      onClick={() => switchLang(code)}
      style={{
        padding: '0.25rem 0.6rem',
        borderRadius: '6px',
        border: uiLang === code ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.3)',
        background: uiLang === code ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
        color: '#fff',
        fontWeight: uiLang === code ? 700 : 400,
        fontSize: '0.78rem',
        cursor: 'pointer',
        transition: 'all 0.15s',
        lineHeight: 1.4,
        opacity: uiLang === code ? 1 : 0.75,
      }}
    >
      {label}
    </button>
  );

  return (
    <nav className="navbar">
      <div className="navbar-brand">{t('nav_brand')}</div>

      <div className="navbar-links">
        {/* Language switcher */}
        <div style={{ display: 'flex', gap: '0.35rem', marginRight: '0.4rem' }}>
          {langBtn('en', 'EN')}
          {langBtn('si', 'සිං')}
          {langBtn('ta', 'த')}
        </div>

        {user ? (
          <>
            {user.role === 'USER' && (
              <>
                <Link to="/student/dashboard">{t('nav_dashboard')}</Link>
                <Link to="/student/profile">{t('nav_profile')}</Link>
              </>
            )}
            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <Link to="/dashboard">{t('nav_dashboard')}</Link>
            )}
            <span className="user-chip">{roleLabel[user.role] || user.role} · {user.name}</span>
            <button onClick={handleLogout} className="btn btn-danger">{t('nav_logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login">{t('nav_login')}</Link>
            <Link to="/register">{t('nav_register')}</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
