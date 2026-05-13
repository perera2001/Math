import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Login Modal ─────────────────────────────────────────────────── */
export const LoginModal = ({ onClose, onSwitchToRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      onClose();
      navigate(user?.role === "USER" ? "/student/dashboard" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-modal-backdrop" onClick={onClose}>
      <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lp-modal-close" onClick={onClose}>&#10005;</button>

        <div className="lp-modal-logo">
          <span>🧮</span>
          <span className="lp-modal-brand">MathsApp</span>
        </div>

        <h2 className="lp-modal-title">Welcome Back!</h2>
        <p className="lp-modal-sub">Sign in to continue your learning journey</p>

        {error && <div className="lp-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="lp-modal-form">
          <div className="lp-form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          <div className="lp-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="lp-modal-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="lp-modal-footer">
          New student?{" "}
          <button className="lp-modal-switch" onClick={onSwitchToRegister}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

/* ── Register Modal ──────────────────────────────────────────────── */
export const RegisterModal = ({ onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      onClose();
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-modal-backdrop" onClick={onClose}>
      <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lp-modal-close" onClick={onClose}>&#10005;</button>

        <div className="lp-modal-logo">
          <span>🧮</span>
          <span className="lp-modal-brand">MathsApp</span>
        </div>

        <h2 className="lp-modal-title">Create Account</h2>
        <p className="lp-modal-sub">Join thousands of students excelling in maths</p>

        {error && <div className="lp-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="lp-modal-form">
          <div className="lp-form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="lp-form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          <div className="lp-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="lp-modal-btn" disabled={loading}>
            {loading ? "Creating account..." : "Get Started"}
          </button>
        </form>

        <p className="lp-modal-footer">
          Already have an account?{" "}
          <button className="lp-modal-switch" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
