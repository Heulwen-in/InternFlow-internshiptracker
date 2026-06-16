import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function AuthFlowShell({ kicker, heading, sub, children, footer, backTo }) {
  return (
    <div className="auth-wrap">
      <div className="flow-card">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span className="wordmark flow-wordmark">
            Intern<b>Flow</b>
          </span>
          <div className="flow-kicker">{kicker}</div>
          <h1 className="flow-heading">{heading}</h1>
          {sub && <p className="flow-sub">{sub}</p>}
        </div>
        <div className="card flow-body">{children}</div>
        {footer}
        {backTo && (
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Link
              className="btn btn-ghost btn-sm"
              to={backTo}
              style={{ color: "var(--faint)" }}
            >
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthFlowShell;
