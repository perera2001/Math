import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LoginModal, RegisterModal } from "../components/AuthModals";

/* ══════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const [modal, setModal] = useState(null); // null | "login" | "register"

  const openLogin = () => setModal("login");
  const openRegister = () => setModal("register");
  const closeModal = () => setModal(null);

  /* ── FAQ state ── */
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "Who is MathsApp for?",
      a: "MathsApp is designed for Sri Lankan O/L students in Grades 9, 10, and 11 who want to strengthen their Mathematics skills through regular, gamified practice.",
    },
    {
      q: "What subjects are covered?",
      a: "We cover three core O/L Mathematics topics: Geometry, Algebra, and Number Theory -- all aligned to the national curriculum.",
    },
    {
      q: "Is MathsApp free to use?",
      a: "Yes! Every student can register for free and access all quizzes, the leaderboard, and their personal performance dashboard at no cost.",
    },
    {
      q: "How does the scoring system work?",
      a: "Each quiz awards stars based on your accuracy and speed. Correct answers earn points, and consecutive correct answers build a streak bonus. Your stats appear on the leaderboard.",
    },
    {
      q: "Can I practice in Sinhala or Tamil?",
      a: "Absolutely. Questions are available in English, Sinhala and Tamil. You can choose your preferred language before every quiz.",
    },
    {
      q: "How are the difficulty levels different?",
      a: "Easy quizzes are ideal for revision. Medium questions require deeper understanding, while Hard questions challenge you with multi-step problems -- great for exam preparation.",
    },
  ];

  const steps = [
    {
      icon: "📝",
      step: "01",
      title: "Register",
      desc: "Create your free account with your name, email, and grade.",
    },
    {
      icon: "⚙️",
      step: "02",
      title: "Configure",
      desc: "Choose your subject, difficulty, time limit, and language.",
    },
    {
      icon: "🎯",
      step: "03",
      title: "Play",
      desc: "Answer 8 questions at your own pace -- go back, edit, and review.",
    },
    {
      icon: "📊",
      step: "04",
      title: "Analyse",
      desc: "See your score, stars, and performance breakdown instantly.",
    },
    {
      icon: "🏆",
      step: "05",
      title: "Compete",
      desc: "Climb the leaderboard and track your improvement over time.",
    },
  ];

  const features = [
    {
      icon: "🌐",
      title: "Trilingual Support",
      desc: "Questions available in English, Sinhala & Tamil so every student can learn in their comfort language.",
    },
    {
      icon: "⭐",
      title: "Star-Based Rewards",
      desc: "Earn stars for every correct answer and build streaks to unlock higher scores.",
    },
    {
      icon: "📊",
      title: "Smart Analytics",
      desc: "Visual dashboards track your score trends, topic strengths, and difficulty breakdown.",
    },
    {
      icon: "🏆",
      title: "Live Leaderboard",
      desc: "Compete with fellow students in real time, filtered by subject or overall rank.",
    },
    {
      icon: "⏱",
      title: "Flexible Timing",
      desc: "Choose 8-minute, 16-minute, or unlimited mode depending on your study goals.",
    },
    {
      icon: "🎓",
      title: "Curriculum Aligned",
      desc: "All questions are mapped to the Sri Lanka O/L Mathematics syllabus for Grades 9-11.",
    },
  ];

  return (
    <div className="lp-page">
      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <div className="lp-hero-badge">&#127891; Grades 9 · 10 · 11</div>
          <h1 className="lp-hero-title">
            Master Mathematics.
            <br />
            <span className="lp-hero-accent">Play. Compete. Excel.</span>
          </h1>
          <p className="lp-hero-subtitle">
            The smartest way for Sri Lankan O/L students to practise Maths --
            quizzes, leaderboards, and analytics in three languages.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={openRegister}>
              Get Started -- It&apos;s Free
            </button>
            <button className="lp-btn-outline" onClick={openLogin}>
              Sign In
            </button>
          </div>
          <div className="lp-hero-stats">
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">3</span>
              <span className="lp-hero-stat-lbl">Subjects</span>
            </div>
            <div className="lp-hero-stat-divider" />
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">3</span>
              <span className="lp-hero-stat-lbl">Languages</span>
            </div>
            <div className="lp-hero-stat-divider" />
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">3</span>
              <span className="lp-hero-stat-lbl">Grade Levels</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Why MathsApp?</div>
          <h2 className="lp-section-title">Our Specialities</h2>
          <p className="lp-section-sub">
            Everything you need to go from confused to confident in O/L Maths.
          </p>
          <div className="lp-features-grid">
            {features.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section lp-how" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Simple Process</div>
          <h2 className="lp-section-title">How It Works</h2>
          <p className="lp-section-sub">
            Five simple steps from sign-up to leaderboard glory.
          </p>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <React.Fragment key={s.step}>
                <div className="lp-step">
                  <div className="lp-step-icon-wrap">
                    <div className="lp-step-icon">{s.icon}</div>
                    <div className="lp-step-num">{s.step}</div>
                  </div>
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="lp-step-arrow">&#8594;</div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="lp-how-cards">
            <div className="lp-how-card lp-how-card--quiz">
              <div className="lp-how-card-icon">🎯</div>
              <div className="lp-how-card-title">Pick Your Challenge</div>
              <div className="lp-how-card-desc">
                Geometry · Algebra · Numbers
                <br />
                Easy · Medium · Hard
              </div>
            </div>
            <div className="lp-how-card lp-how-card--play">
              <div className="lp-how-card-icon">&#9654;</div>
              <div className="lp-how-card-title">Navigate Freely</div>
              <div className="lp-how-card-desc">
                Go back, change answers,
                <br />
                review before submitting
              </div>
            </div>
            <div className="lp-how-card lp-how-card--result">
              <div className="lp-how-card-icon">📈</div>
              <div className="lp-how-card-title">See Your Progress</div>
              <div className="lp-how-card-desc">
                Detailed score breakdown
                <br />
                and performance trends
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section lp-faq" id="faq">
        <div className="lp-section-inner lp-faq-inner">
          <div className="lp-faq-left">
            <div className="lp-section-tag">Got Questions?</div>
            <h2 className="lp-section-title">Frequently Asked Questions</h2>
            <p className="lp-section-sub">
              Everything you need to know before you start.
            </p>
            <button
              className="lp-btn-primary"
              style={{ marginTop: "1.5rem" }}
              onClick={openRegister}
            >
              Start Learning Free
            </button>
          </div>
          <div className="lp-faq-right">
            {faqs.map((f, i) => (
              <div
                key={i}
                className={"lp-faq-item" + (openFaq === i ? " open" : "")}
              >
                <button
                  className="lp-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{f.q}</span>
                  <span className="lp-faq-chevron">
                    {openFaq === i ? "▲" : "▼"}
                  </span>
                </button>
                {openFaq === i && <div className="lp-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="lp-section lp-about" id="about">
        <div className="lp-section-inner">
          <div className="lp-about-grid">
            <div className="lp-about-text">
              <div className="lp-section-tag">About Us</div>
              <h2 className="lp-section-title">
                Built for Sri Lankan Students
              </h2>
              <p className="lp-about-desc">
                MathsApp was created by educators who believe every student
                deserves engaging, accessible, and high-quality maths practice
                -- regardless of their first language.
              </p>
              <p className="lp-about-desc">
                We focus exclusively on the O/L Mathematics syllabus, covering
                Geometry, Algebra, and Numbers in English, Sinhala, and Tamil.
                Our adaptive difficulty system ensures that whether you are just
                starting out or preparing for your final exam, there is always a
                challenge that grows with you.
              </p>
              <div className="lp-about-pills">
                <span className="lp-about-pill">Sri Lanka Focused</span>
                <span className="lp-about-pill">O/L Curriculum</span>
                <span className="lp-about-pill">Always Free</span>
                <span className="lp-about-pill">Trilingual</span>
              </div>
            </div>
            <div className="lp-about-visual">
              <div className="lp-about-card lp-about-card--1">
                <div className="lp-about-card-icon">🧮</div>
                <div className="lp-about-card-val">Geometry</div>
                <div className="lp-about-card-lbl">Angles, Lines, Shapes</div>
              </div>
              <div className="lp-about-card lp-about-card--2">
                <div className="lp-about-card-icon">📐</div>
                <div className="lp-about-card-val">Algebra</div>
                <div className="lp-about-card-lbl">Equations, Expressions</div>
              </div>
              <div className="lp-about-card lp-about-card--3">
                <div className="lp-about-card-icon">🔢</div>
                <div className="lp-about-card-val">Numbers</div>
                <div className="lp-about-card-lbl">Primes, Factors, Sets</div>
              </div>
              <div className="lp-about-card lp-about-card--4">
                <div className="lp-about-card-icon">🏆</div>
                <div className="lp-about-card-val">Compete</div>
                <div className="lp-about-card-lbl">Live Leaderboards</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to Ace Your O/L Maths?</h2>
          <p className="lp-cta-sub">
            Join students already improving their scores with MathsApp.
          </p>
          <button className="lp-btn-primary lp-btn-lg" onClick={openRegister}>
            Create Free Account
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo">🧮</span>
            <span className="lp-footer-name">MathsApp</span>
          </div>
          <p className="lp-footer-copy">
            &copy; 2026 MathsApp. Built for Sri Lankan O/L students.
          </p>
          <div className="lp-footer-links">
            <button className="lp-footer-link" onClick={openLogin}>
              Sign In
            </button>
            <button className="lp-footer-link" onClick={openRegister}>
              Register
            </button>
            <Link
              to="/docs"
              className="lp-footer-link"
              style={{ textDecoration: "none" }}
            >
              Docs
            </Link>
          </div>
        </div>
      </footer>

      {/* MODALS */}
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
    </div>
  );
};

export default LandingPage;
