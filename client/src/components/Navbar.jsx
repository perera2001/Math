import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
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

  return (
    <nav className="navbar">
      <div className="navbar-brand">🧮 MathsApp</div>

      <div className="navbar-links">
        {user ? (
          <>
            <span className="user-chip">{roleLabel[user.role] || user.role} · {user.name}</span>
            <button onClick={handleLogout} className="btn btn-danger">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
