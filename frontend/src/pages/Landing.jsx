import { useNavigate } from "react-router-dom";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/ThemeContext";
import StatusBadge from "../components/StatusBadge";

const FEATURES = [
  {
    kicker: "01 — Pipeline",
    title: "See every application at a glance",
    body: "A table, cards, or a kanban board — your whole pipeline from Saved to Offer, however you like to scan it.",
  },
  {
    kicker: "02 — Momentum",
    title: "Never miss what's next",
    body: "Deadlines, interviews, and follow-up tasks surface themselves before they slip — not after.",
  },
  {
    kicker: "03 — Memory",
    title: "Context lives with the application",
    body: "Notes, interview history, and status changes stay attached to each role, so prep never starts from zero.",
  },
];

function Landing() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="wordmark">
          Intern<b>Flow</b>
        </span>
        <div className="landing-nav-actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Open dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate("/login")}>
                Sign in
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/register")}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div>
          <div className="landing-kicker">Internship season, organized</div>
          <h1 className="landing-h1">
            Every application, interview &amp; follow-up — <em>in one place.</em>
          </h1>
          <p className="landing-sub">
            InternFlow helps you organize applications, interviews, tasks, and
            follow-ups without losing track of what matters next.
          </p>
          <div className="landing-ctas">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate("/register")}
            >
              Start tracking <ArrowRight size={15} />
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={() => navigate("/login")}
            >
              I have an account
            </button>
          </div>
        </div>

        <div className="hero-card" aria-hidden="true">
          <div className="mono-label" style={{ padding: "2px 10px 10px" }}>
            This week
          </div>
          <div className="hero-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                Linear Labs — SWE Intern
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Pairing session · Mon 2:00 PM
              </div>
            </div>
            <StatusBadge status="Interview" />
          </div>
          <div className="hero-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                Northwind Capital — Data Science
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                OA window closes Sat
              </div>
            </div>
            <StatusBadge status="Online Assessment" />
          </div>
          <div className="hero-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                Ferry — Backend Intern
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Offer decision due Jun 19
              </div>
            </div>
            <StatusBadge status="Offer" />
          </div>
        </div>
      </section>

      <section className="landing-feats">
        {FEATURES.map((f) => (
          <div className="feat" key={f.kicker}>
            <span className="mono-label">{f.kicker}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Landing;
