import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const features = [
  {
    title: "Track every application",
    description: "Keep company, role, deadline, priority, and status in one tidy view.",
  },
  {
    title: "Plan your next action",
    description:
      "Use tasks, notes, interviews, and status history to reduce mental load.",
  },
  {
    title: "Move with confidence",
    description: "Kanban and dashboard summaries make progress visible at a glance.",
  },
];

function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link to="/" className="brand-mark">
          <span>IF</span>
          InternFlow
        </Link>

        <div className="landing-nav__actions">
          {isAuthenticated ? (
            <Link className="button-link" to="/dashboard">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link className="button-link secondary" to="/login">
                Login
              </Link>
              <Link className="button-link" to="/register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <span className="eyebrow">Internship tracker for focused applicants</span>
          <h1>Turn a messy internship search into a clear daily workflow.</h1>
          <p>
            InternFlow helps you organize applications, interviews, tasks, and follow-ups
            without losing track of what matters next.
          </p>

          <div className="landing-actions">
            <Link className="button-link button-link--large" to="/register">
              Start Tracking
            </Link>
            <Link className="button-link secondary button-link--large" to="/login">
              I Already Have an Account
            </Link>
          </div>
        </div>

        <div className="landing-preview" aria-label="InternFlow dashboard preview">
          <div className="preview-card preview-card--primary">
            <span>Applications</span>
            <strong>24</strong>
            <small>6 interviews this month</small>
          </div>
          <div className="preview-row">
            <div className="preview-card">
              <span>Next deadline</span>
              <strong>Jun 12</strong>
            </div>
            <div className="preview-card">
              <span>Open tasks</span>
              <strong>8</strong>
            </div>
          </div>
          <div className="preview-list">
            <div>
              <span>Saved</span>
              <strong>Research company</strong>
            </div>
            <div>
              <span>Interview</span>
              <strong>Prepare system design notes</strong>
            </div>
            <div>
              <span>Offer</span>
              <strong>Review compensation details</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" aria-label="InternFlow features">
        {features.map((feature) => (
          <article key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Landing;
