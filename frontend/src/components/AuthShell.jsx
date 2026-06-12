import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function AuthShell({ tagline, onSubmit, children, footer, backTo = "/" }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <span className="wordmark" style={{ fontSize: 26, justifyContent: "center" }}>
            Intern<b>Flow</b>
          </span>
          <p style={{ color: "var(--muted)", marginTop: 10, fontSize: 14.5 }}>
            {tagline}
          </p>
        </div>

        <form className="card auth-form" onSubmit={onSubmit}>
          {children}
        </form>

        {footer && <div className="auth-switch">{footer}</div>}

        <div className="auth-back">
          <Link className="btn btn-ghost btn-sm" to={backTo} style={{ color: "var(--faint)" }}>
            <ArrowLeft size={13} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
