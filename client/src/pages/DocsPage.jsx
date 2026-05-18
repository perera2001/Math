import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════════════════════════
   DOCS PAGE  —  Public route, no auth required
   Explains: quiz structure, scoring, rank system, SPP, SBP, XP
══════════════════════════════════════════════════════════════════ */

const RANK_LIST = [
  { name: "Beginner",     stars: 3, emoji: "🌱", index: 0 },
  { name: "Learner",      stars: 3, emoji: "📖", index: 1 },
  { name: "Apprentice",   stars: 4, emoji: "🔨", index: 2 },
  { name: "Skilled",      stars: 4, emoji: "⚔️",  index: 3 },
  { name: "Expert",       stars: 5, emoji: "🏛️", index: 4 },
  { name: "Master",       stars: 5, emoji: "👑", index: 5 },
  { name: "Grandmaster",  stars: 6, emoji: "🌀", index: 6 },
  { name: "Mythic",       stars: 7, emoji: "🔮", index: 7 },
  { name: "Legend",       stars: 8, emoji: "✨", index: 8 },
];

const OUTCOMES = [
  { label: "🌟 Flawless", condition: "≥ 87.5%  (≥ 700 pts)",  stars: "+2", xp: "+200", coins: "+5",  color: "#fbbf24", bg: "#451a03" },
  { label: "✅ Victory",  condition: "≥ 62.5%  (≥ 500 pts)",  stars: "+1", xp: "+120", coins: "+3",  color: "#60a5fa", bg: "#1e3a8a" },
  { label: "🤝 Draw",     condition: "≥ 37.5%  (≥ 300 pts)",  stars: "0",  xp: "+60",  coins: "+1",  color: "#94a3b8", bg: "#1e293b" },
  { label: "❌ Defeat",   condition: "< 37.5%  (< 300 pts)",  stars: "−1*",xp: "+30",  coins: "0",   color: "#f87171", bg: "#450a0a" },
];

const SCORE_REF = [
  { correct: "8 / 8", pts: "800", pct: "100%", outcome: "Flawless",  oc: "#fbbf24" },
  { correct: "7 / 8", pts: "700", pct: "87.5%",outcome: "Flawless",  oc: "#fbbf24" },
  { correct: "6 / 8", pts: "600", pct: "75%",  outcome: "Victory",   oc: "#60a5fa" },
  { correct: "5 / 8", pts: "500", pct: "62.5%",outcome: "Victory",   oc: "#60a5fa" },
  { correct: "4 / 8", pts: "400", pct: "50%",  outcome: "Draw",      oc: "#94a3b8" },
  { correct: "3 / 8", pts: "300", pct: "37.5%",outcome: "Draw",      oc: "#94a3b8" },
  { correct: "2 / 8", pts: "200", pct: "25%",  outcome: "Defeat",    oc: "#f87171" },
  { correct: "1 / 8", pts: "100", pct: "12.5%",outcome: "Defeat",    oc: "#f87171" },
];

const SPP_TIMELINE = [
  { game: 1, outcome: "Defeat",  oc: "#f87171", before: 3, after: 2, note: "Shield used — star saved ✓" },
  { game: 2, outcome: "Defeat",  oc: "#f87171", before: 2, after: 1, note: "Shield used — star saved ✓" },
  { game: 3, outcome: "Defeat",  oc: "#f87171", before: 1, after: 0, note: "Last shield used — star saved ✓" },
  { game: 4, outcome: "Defeat",  oc: "#f87171", before: 0, after: 1, note: "No shield left — ★ STAR LOST" },
  { game: 5, outcome: "Draw",    oc: "#94a3b8", before: 1, after: 2, note: "+1 SPP from Draw (rebuilding)" },
  { game: 6, outcome: "Draw",    oc: "#94a3b8", before: 2, after: 3, note: "Back to full 3 shields" },
];

/* ── Section wrapper ── */
const Section = ({ id, title, emoji, children }) => (
  <section id={id} style={{
    background: "#0f172a",
    border: "1.5px solid #1e293b",
    borderRadius: 18,
    padding: "2rem 2.2rem",
    marginBottom: "1.8rem",
    scrollMarginTop: 80,
  }}>
    <h2 style={{
      display: "flex", alignItems: "center", gap: 10,
      fontSize: "1.2rem", fontWeight: 800, color: "#e2e8f0",
      marginBottom: "1.2rem", paddingBottom: "0.8rem",
      borderBottom: "2px solid #1e293b",
    }}>
      <span style={{ fontSize: "1.4rem" }}>{emoji}</span>
      {title}
    </h2>
    {children}
  </section>
);

/* ── Small info pill ── */
const Pill = ({ children, color = "#60a5fa", bg = "#1e3a8a" }) => (
  <span style={{
    display: "inline-block", padding: "2px 10px",
    borderRadius: 999, fontSize: 12, fontWeight: 700,
    color, background: bg, whiteSpace: "nowrap",
  }}>{children}</span>
);

/* ── Callout box ── */
const Callout = ({ children, color = "#4338ca", bg = "#1e1b4b", border = "#4338ca" }) => (
  <div style={{
    background: bg, borderLeft: `4px solid ${border}`,
    borderRadius: "0 10px 10px 0", padding: "12px 16px",
    fontSize: 13.5, color: "#cbd5e1", margin: "12px 0", lineHeight: 1.7,
  }}>{children}</div>
);

/* ── Table ── */
const DocsTable = ({ headers, rows, colWidths }) => (
  <div style={{ overflowX: "auto", margin: "12px 0" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
      <thead>
        <tr style={{ background: "#1e293b" }}>
          {headers.map((h, i) => (
            <th key={i} style={{
              padding: "9px 14px", textAlign: "left", fontWeight: 700,
              color: "#94a3b8", fontSize: 12, letterSpacing: "0.5px",
              width: colWidths?.[i],
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ borderBottom: "1px solid #1e293b" }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: "9px 14px", color: "#cbd5e1" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Side nav link ── */
const NavLink = ({ to, children, active, onClick }) => (
  <a href={to} onClick={onClick} style={{
    display: "block", padding: "7px 14px", borderRadius: 8,
    fontSize: 13.5, fontWeight: active ? 700 : 500,
    color: active ? "#818cf8" : "#94a3b8",
    background: active ? "#1e1b4b" : "transparent",
    textDecoration: "none", transition: "all 0.15s",
    borderLeft: active ? "3px solid #818cf8" : "3px solid transparent",
    marginBottom: 2,
  }}>{children}</a>
);

const SECTIONS = [
  { id: "quiz-structure", label: "Quiz Structure" },
  { id: "scoring",        label: "Points & Scoring" },
  { id: "outcomes",       label: "Game Outcomes" },
  { id: "ranks",          label: "Rank System" },
  { id: "promotion",      label: "Promotion & Demotion" },
  { id: "spp",            label: "Protection Points (SPP)" },
  { id: "sbp",            label: "Bonus Points (SBP)" },
  { id: "xp",             label: "Profile XP & Level" },
];

/* ══════════════════════════════════════════════════════════════════ */
const DocsPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("quiz-structure");

  const scrollTo = (id, e) => {
    e.preventDefault();
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020617 0%, #0f172a 60%, #020617 100%)",
      color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── TOP BAR ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(2,6,23,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1e293b",
        padding: "0.9rem 2rem",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "1px solid #334155", borderRadius: 8,
          color: "#94a3b8", padding: "6px 14px", cursor: "pointer",
          fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
        }}>← Back</button>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>🧮 MathsApp</span>
        <span style={{
          background: "#312e81", color: "#a5b4fc",
          fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
          letterSpacing: 1, textTransform: "uppercase",
        }}>Docs</span>
      </div>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem", gap: "2rem" }}>

        {/* ── SIDE NAV (desktop) ── */}
        <aside style={{
          width: 200, flexShrink: 0,
          position: "sticky", top: 70, alignSelf: "flex-start",
          display: "flex", flexDirection: "column",
          maxHeight: "calc(100vh - 90px)", overflowY: "auto",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "1px",
            textTransform: "uppercase", marginBottom: 8, paddingLeft: 14 }}>On this page</p>
          {SECTIONS.map(s => (
            <NavLink
              key={s.id} to={`#${s.id}`}
              active={activeSection === s.id}
              onClick={(e) => scrollTo(s.id, e)}
            >{s.label}</NavLink>
          ))}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* PAGE HEADER */}
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", marginBottom: 8 }}>
              How MathsApp Works
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7 }}>
              Everything you need to know about quizzes, scoring, ranks, shields, and rewards — explained from the ground up.
            </p>
          </div>

          {/* ── 1. QUIZ STRUCTURE ── */}
          <Section id="quiz-structure" emoji="📋" title="Quiz Structure">
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16, lineHeight: 1.8 }}>
              Each quiz is a timed challenge of <strong style={{ color: "#e2e8f0" }}>8 questions</strong> randomly selected from the question bank for your chosen grade, topic, and difficulty.
              Before starting, you configure:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { icon: "🎓", label: "Grade", val: "Grade 9, 10, or 11" },
                { icon: "📐", label: "Topic", val: "Geometry · Algebra · Number Theory" },
                { icon: "⚡", label: "Difficulty", val: "Easy · Medium · Hard" },
                { icon: "⏱️", label: "Time Mode", val: "8 min · 16 min · Unlimited" },
                { icon: "🌐", label: "Language", val: "English · Sinhala · Tamil" },
              ].map(c => (
                <div key={c.label} style={{
                  background: "#1e293b", borderRadius: 12, padding: "14px 16px",
                  border: "1px solid #334155",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.val}</div>
                </div>
              ))}
            </div>
            <Callout color="#a5b4fc" bg="#1e1b4b" border="#4338ca">
              <strong>Lifelines:</strong> Each quiz gives you 3 lifelines — <strong>50/50</strong> (removes 2 wrong options),
              <strong> Skip</strong> (skips the question with no penalty), and <strong>+30s</strong> (adds 30 seconds to the timer in timed modes). Each lifeline can only be used once per quiz.
            </Callout>
          </Section>

          {/* ── 2. SCORING ── */}
          <Section id="scoring" emoji="⭐" title="Points & Scoring">
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 14, lineHeight: 1.8 }}>
              Points are earned per question based on how many attempts were needed. You get up to <strong style={{ color: "#e2e8f0" }}>2 attempts</strong> per question.
            </p>
            <DocsTable
              headers={["Attempt Result", "Points", "Notes"]}
              colWidths={["45%", "20%", "35%"]}
              rows={[
                ["Correct on 1st attempt", <strong style={{ color: "#4ade80" }}>+100 pts</strong>, "Full marks — no mistakes"],
                ["Correct on 2nd attempt", <strong style={{ color: "#fbbf24" }}>+50 pts</strong>, "Half marks — tried again"],
                ["Wrong on both attempts", <strong style={{ color: "#f87171" }}>0 pts</strong>, "No marks awarded"],
              ]}
            />
            <div style={{
              background: "#1e293b", border: "1px solid #334155",
              borderRadius: 10, padding: "12px 18px", fontFamily: "monospace",
              fontSize: 13, color: "#7dd3fc", margin: "14px 0",
            }}>
              Max Score = 8 questions × 100 pts = <strong>800 pts</strong>
              <br />
              Game % = (Your Score ÷ 800) × 100
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "18px 0 10px" }}>Quick Reference Table</h3>
            <DocsTable
              headers={["Correct Answers (1st attempt)", "Score", "Percentage", "Outcome"]}
              rows={SCORE_REF.map(r => [
                r.correct,
                `${r.pts} pts`,
                r.pct,
                <Pill color={r.oc} bg={r.oc + "22"}>{r.outcome}</Pill>,
              ])}
            />
          </Section>

          {/* ── 3. OUTCOMES ── */}
          <Section id="outcomes" emoji="🏆" title="Game Outcomes">
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16, lineHeight: 1.8 }}>
              At the end of every quiz, your score percentage determines your <strong style={{ color: "#e2e8f0" }}>outcome</strong>.
              The outcome decides how many rank stars you gain or lose, plus XP and coins.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {OUTCOMES.map(o => (
                <div key={o.label} style={{
                  display: "grid", gridTemplateColumns: "180px 1fr 60px 60px 60px",
                  alignItems: "center", gap: 12,
                  background: o.bg, border: `1px solid ${o.color}33`,
                  borderLeft: `4px solid ${o.color}`,
                  borderRadius: 10, padding: "12px 16px",
                }}>
                  <span style={{ fontWeight: 800, color: o.color, fontSize: 14 }}>{o.label}</span>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{o.condition}</span>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>STARS</div>
                    <strong style={{ color: o.color }}>{o.stars}</strong>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>XP</div>
                    <strong style={{ color: "#a5b4fc" }}>{o.xp}</strong>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>COINS</div>
                    <strong style={{ color: "#fbbf24" }}>{o.coins}</strong>
                  </div>
                </div>
              ))}
            </div>
            <Callout color="#94a3b8" bg="#0f172a" border="#475569">
              * Defeat = −1 star, but only if your <strong>Star Protection (SPP)</strong> shields are empty.
              See the <a href="#spp" onClick={(e) => scrollTo("spp", e)} style={{ color: "#60a5fa" }}>Protection Points section</a> for full details.
            </Callout>
          </Section>

          {/* ── 4. RANKS ── */}
          <Section id="ranks" emoji="🎖️" title="Rank System">
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16, lineHeight: 1.8 }}>
              There are <strong style={{ color: "#e2e8f0" }}>9 regular ranks</strong> plus 1 prestige rank.
              Each rank has <strong style={{ color: "#e2e8f0" }}>3 tiers</strong> (Tier 3 lowest → Tier 1 highest).
              You fill stars to progress through tiers and ranks.
              New players start at <strong style={{ color: "#e2e8f0" }}>Beginner Tier 3, 0 stars</strong>.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
              {RANK_LIST.map(r => (
                <div key={r.name} style={{
                  background: "#1e293b", border: "1px solid #334155",
                  borderRadius: 12, padding: "14px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{r.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#e2e8f0" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {r.stars} stars / tier
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>3 tiers</div>
                </div>
              ))}
            </div>
            <div style={{
              background: "linear-gradient(135deg, #451a03, #78350f)",
              border: "1px solid #f59e0b",
              borderRadius: 14, padding: "16px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🌟</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#fbbf24" }}>Legendary Sage</div>
              <div style={{ fontSize: 12, color: "#fde68a", marginTop: 4 }}>
                Prestige rank · Achieved by completing Legend Tier 1 · No demotion possible · Infinite prestige stars
              </div>
            </div>
          </Section>

          {/* ── 5. PROMOTION & DEMOTION ── */}
          <Section id="promotion" emoji="📈" title="Promotion & Demotion">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>

              <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 12, padding: "16px" }}>
                <h3 style={{ color: "#4ade80", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>▲ Promotion (Moving Up)</h3>
                <ul style={{ paddingLeft: 16, fontSize: 13, color: "#86efac", lineHeight: 2.1 }}>
                  <li>Fill all stars in Tier 3 → moves to <strong>Tier 2</strong></li>
                  <li>Fill all stars in Tier 2 → moves to <strong>Tier 1</strong></li>
                  <li>Fill all stars in Tier 1 → moves to next <strong>rank, Tier 3</strong></li>
                  <li>Finish Legend Tier 1 → become <strong>Legendary Sage</strong></li>
                  <li>+2 Flawless stars can jump over a tier boundary (overflow carries)</li>
                </ul>
              </div>

              <div style={{ background: "#450a0a", border: "1px solid #991b1b", borderRadius: 12, padding: "16px" }}>
                <h3 style={{ color: "#f87171", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>▼ Demotion (Moving Down)</h3>
                <ul style={{ paddingLeft: 16, fontSize: 13, color: "#fca5a5", lineHeight: 2.1 }}>
                  <li>Lose a star at 0 stars in Tier 2 → drops to Tier 3 at <strong>(max−1) stars</strong></li>
                  <li>Lose a star at 0 stars in Tier 3 → stays at Tier 3, 0 stars <strong>(rank floor)</strong></li>
                  <li>You can <strong>never</strong> drop below Tier 3 of your current rank</li>
                  <li>You can <strong>never</strong> be demoted to a lower rank</li>
                </ul>
              </div>
            </div>

            <Callout color="#fbbf24" bg="#1c1002" border="#d97706">
              <strong>Demotion Example (Apprentice — 4 stars/tier):</strong><br />
              At Apprentice Tier 2, 0/4 stars → Defeat → drops to <strong>Apprentice Tier 3, 3/4 stars</strong>.<br />
              At Apprentice Tier 3, 0/4 stars → Defeat → stays at <strong>Apprentice Tier 3, 0/4 stars</strong> (floor).
            </Callout>
          </Section>

          {/* ── 6. SPP ── */}
          <Section id="spp" emoji="🛡️" title="Star Protection Points (SPP)">
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 14, lineHeight: 1.8 }}>
              SPP are <strong style={{ color: "#e2e8f0" }}>shield points</strong> that protect your rank stars from being lost on a Defeat.
              You can hold a maximum of <strong style={{ color: "#e2e8f0" }}>3 shields</strong> at one time, shown as shield icons 🛡️🛡️🛡️ on your profile.
            </p>
            <DocsTable
              headers={["Situation", "Shield Effect", "Star Effect"]}
              rows={[
                [<Pill color="#94a3b8" bg="#1e293b">🤝 Draw</Pill>,               "+1 SPP gained",                   "No change"],
                [<Pill color="#f87171" bg="#450a0a">❌ Defeat (SPP &gt; 0)</Pill>, "−1 SPP permanently consumed",     <span style={{ color: "#4ade80", fontWeight: 700 }}>★ Star SAVED</span>],
                [<Pill color="#f87171" bg="#450a0a">❌ Defeat (SPP = 0)</Pill>,    "+1 SPP gained (starts rebuilding)",<span style={{ color: "#f87171", fontWeight: 700 }}>★ Star LOST</span>],
              ]}
            />
            <Callout color="#f87171" bg="#1c0202" border="#dc2626">
              Each shield is <strong>permanently consumed</strong> when used — it does not come back automatically.
              With 3 shields you can survive 3 consecutive Defeats without losing a star.
              The 4th Defeat (0 shields) will cost you a star, and you get 1 shield back to start rebuilding.
            </Callout>

            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "18px 0 10px" }}>SPP Example Timeline (starting with 3 shields)</h3>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #1e293b" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "50px 110px 80px 80px 1fr",
                background: "#1e293b", padding: "9px 14px", gap: 10,
                fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px",
              }}>
                <span>GAME</span><span>OUTCOME</span><span>SPP BEFORE</span><span>SPP AFTER</span><span>RESULT</span>
              </div>
              {SPP_TIMELINE.map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "50px 110px 80px 80px 1fr",
                  padding: "10px 14px", gap: 10, alignItems: "center",
                  background: i % 2 === 0 ? "#0f1629" : "#0a0f1e",
                  borderTop: "1px solid #1e293b", fontSize: 13,
                }}>
                  <span style={{ color: "#64748b", fontWeight: 700 }}>{row.game}</span>
                  <span style={{ color: row.oc, fontWeight: 600 }}>{row.outcome}</span>
                  <span style={{ display: "flex", gap: 3 }}>
                    {[...Array(3)].map((_, si) => (
                      <span key={si} style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: si < row.before ? "#60a5fa" : "#1e293b",
                        border: "1.5px solid " + (si < row.before ? "#60a5fa" : "#334155"),
                        display: "inline-block",
                      }} />
                    ))}
                  </span>
                  <span style={{ display: "flex", gap: 3 }}>
                    {[...Array(3)].map((_, si) => (
                      <span key={si} style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: si < row.after ? "#60a5fa" : "#1e293b",
                        border: "1.5px solid " + (si < row.after ? "#60a5fa" : "#334155"),
                        display: "inline-block",
                      }} />
                    ))}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: row.note.includes("LOST") ? "#f87171" : row.note.includes("saved") ? "#4ade80" : "#94a3b8",
                    fontWeight: row.note.includes("LOST") ? 700 : 400,
                  }}>{row.note}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 7. SBP ── */}
          <Section id="sbp" emoji="💎" title="Star Bonus Points (SBP)">
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 14, lineHeight: 1.8 }}>
              SBP are <strong style={{ color: "#e2e8f0" }}>diamond bonus points</strong> that accumulate when you play well.
              Once you collect enough, the system automatically upgrades your next Victory into a Flawless-level reward.
              Maximum <strong style={{ color: "#e2e8f0" }}>5 diamonds</strong>.
            </p>

            <DocsTable
              headers={["Outcome", "SBP Gained"]}
              colWidths={["60%", "40%"]}
              rows={[
                [<Pill color="#fbbf24" bg="#451a03">🌟 Flawless (natural)</Pill>, "+1 SBP"],
                [<Pill color="#60a5fa" bg="#1e3a8a">✅ Victory</Pill>,             "+1 SBP"],
                [<Pill color="#94a3b8" bg="#1e293b">🤝 Draw</Pill>,                "0 SBP"],
                [<Pill color="#f87171" bg="#450a0a">❌ Defeat</Pill>,               "0 SBP"],
              ]}
            />

            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "18px 0 10px" }}>Auto-Redemption Rules</h3>

            <Callout color="#4ade80" bg="#052e16" border="#16a34a">
              <strong>Rule 1 — Victory Upgrade:</strong> If your game result is Victory AND you have <strong>3 or more SBP</strong>,
              the system automatically spends 3 diamonds and upgrades your rewards to <strong>Flawless level</strong>
              (+2 stars, +200 XP, +5 coins). This is called a <em>"Bonus-Boosted"</em> Flawless — even if your score was only in Victory range.
            </Callout>

            <Callout color="#fbbf24" bg="#1c1002" border="#d97706">
              <strong>Rule 2 — Full-Cap Drain:</strong> If you get a natural Flawless AND your SBP is at the max of <strong>5 diamonds</strong>,
              all 5 are drained to 0 so you can start the bonus cycle again.
            </Callout>

            <div style={{ background: "#1e293b", borderRadius: 12, padding: "16px 18px", marginTop: 14, fontSize: 13, color: "#94a3b8", lineHeight: 1.9 }}>
              <strong style={{ color: "#e2e8f0" }}>Example:</strong> Win 3 Victories in a row → SBP reaches 3.
              On the 4th game, even scoring in Victory range (e.g. 5/8 correct),
              the system spends 3 SBP and awards you <strong style={{ color: "#fbbf24" }}>Flawless rewards</strong> (+2 stars, +200 XP, +5 coins).
            </div>
          </Section>

          {/* ── 8. XP & LEVEL ── */}
          <Section id="xp" emoji="📊" title="Profile XP & Level">
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 14, lineHeight: 1.8 }}>
              Profile XP is <strong style={{ color: "#e2e8f0" }}>completely separate from rank stars</strong> and <strong style={{ color: "#e2e8f0" }}>never decreases</strong>.
              Every game awards XP regardless of outcome. As you accumulate XP, your profile level increases.
            </p>
            <div style={{
              background: "#1e293b", borderRadius: 10, padding: "12px 18px",
              fontFamily: "monospace", fontSize: 13, color: "#7dd3fc", marginBottom: 14,
            }}>
              XP to advance from Level N → N+1 = 100 + (N − 1) × 150
            </div>
            <DocsTable
              headers={["Level", "XP Needed (current → next)", "Total XP to Reach Level"]}
              rows={[
                ["Level 1",  "100 XP",   "0 XP"],
                ["Level 2",  "250 XP",   "100 XP"],
                ["Level 3",  "400 XP",   "350 XP"],
                ["Level 4",  "550 XP",   "750 XP"],
                ["Level 5",  "700 XP",   "1,300 XP"],
                ["Level 6",  "850 XP",   "2,000 XP"],
                ["Level 7",  "1,000 XP", "2,850 XP"],
                ["Level 8",  "1,150 XP", "3,850 XP"],
                ["Level 9",  "1,300 XP", "5,000 XP"],
                ["Level 10", "1,450 XP", "6,300 XP"],
              ]}
            />
            <Callout color="#a5b4fc" bg="#1e1b4b" border="#4338ca">
              Even a <strong>Defeat</strong> awards +30 XP — so every quiz you play contributes to your profile level and overall progress.
            </Callout>
          </Section>

          {/* FOOTER */}
          <div style={{ textAlign: "center", padding: "2rem 0 1rem", color: "#334155", fontSize: 13 }}>
            🧮 MathsApp &nbsp;·&nbsp; For Sri Lankan O/L Students &nbsp;·&nbsp; 2026
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocsPage;
