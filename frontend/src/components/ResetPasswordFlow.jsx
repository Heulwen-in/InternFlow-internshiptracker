import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import api from "../api/axios";
import AuthFlowShell from "./AuthFlowShell";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Mirror the backend's assertStrongPassword rules so the flow can't be
// rejected server-side after a "valid" client submit.
const passwordRules = (pw) => [
  pw.length > 8,
  /\d/.test(pw),
  /[A-Z]/.test(pw),
  /[^A-Za-z0-9]/.test(pw),
];

function ResetPasswordFlow({ initialStage = "request", token = "" }) {
  const navigate = useNavigate();

  const [stage, setStage] = useState(initialStage);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const [tokenChecking, setTokenChecking] = useState(initialStage === "set");
  const [tokenInvalid, setTokenInvalid] = useState(false);

  useEffect(() => {
    if (initialStage !== "set") return;
    const validate = async () => {
      setTokenChecking(true);
      if (!token) {
        setTokenInvalid(true);
        setTokenChecking(false);
        return;
      }
      try {
        await api.post("/auth/validate-reset-token", { token });
        setTokenInvalid(false);
      } catch {
        setTokenInvalid(true);
      } finally {
        setTokenChecking(false);
      }
    };
    validate();
  }, [initialStage, token]);

  const requestSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!EMAIL_RE.test(email)) {
      setErrors({ email: "Enter a valid email" });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStage("sent");
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setBusy(false);
    }
  };

  const rules = passwordRules(pw);
  const satisfied = rules.filter(Boolean).length;
  const strength = pw.length === 0 ? 0 : satisfied <= 2 ? 1 : satisfied === 3 ? 2 : 3;
  const strong = satisfied === 4;
  const canUpdate = strong && pw2.length > 0 && pw === pw2;

  const setSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = {};
    if (!strong)
      errs.pw =
        "Use 8+ characters with a number, a capital letter, and a symbol.";
    if (pw2 !== pw) errs.pw2 = "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, password: pw });
      setStage("success");
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setBusy(false);
    }
  };

  if (stage === "request") {
    return (
      <AuthFlowShell
        kicker="Reset password"
        heading={
          <>
            Forgot your <em>password?</em>
          </>
        }
        sub="Enter the email tied to your account and we'll send you a secure link to choose a new one."
        backTo="/login"
      >
        <form
          onSubmit={requestSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div className="field">
            <label className="field-label">Email</label>
            <input
              className="input"
              value={email}
              placeholder="you@school.edu"
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="flow-err">{errors.email}</span>}
          </div>
          {serverError && <span className="flow-err">{serverError}</span>}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ justifyContent: "center" }}
            disabled={busy}
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </AuthFlowShell>
    );
  }

  if (stage === "sent") {
    return (
      <AuthFlowShell
        kicker="Reset password"
        heading={
          <>
            Check your <em>inbox</em>
          </>
        }
        sub={
          <>
            If an account exists for <b>{email}</b>, a reset link is on its way. The
            link expires in 5 minutes.
          </>
        }
        backTo="/login"
      >
        <div style={{ textAlign: "center" }}>
          <div className="flow-seal">
            <Check size={26} />
          </div>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 13.5,
              lineHeight: 1.6,
              margin: "14px 0 0",
              textWrap: "pretty",
            }}
          >
            Didn&apos;t receive it within a minute? Check spam, or request another link.
          </p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ margin: "12px auto 0", color: "var(--accent)" }}
            onClick={() => {
              setStage("request");
              setServerError("");
            }}
          >
            Use a different email
          </button>
        </div>
      </AuthFlowShell>
    );
  }

  if (stage === "set") {
    if (tokenChecking) {
      return (
        <AuthFlowShell
          kicker="Reset password"
          heading={
            <>
              Choose a <em>new password</em>
            </>
          }
        >
          <p style={{ color: "var(--muted)", textAlign: "center" }}>
            Checking your reset link…
          </p>
        </AuthFlowShell>
      );
    }

    if (tokenInvalid) {
      return (
        <AuthFlowShell
          kicker="Reset password"
          heading={
            <>
              Link <em>expired</em>
            </>
          }
          sub="This reset link is invalid or has expired. Request a fresh one to continue."
          backTo="/login"
        >
          <button
            className="btn btn-primary btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() => navigate("/forgot-password")}
          >
            Request a new link <ArrowRight size={15} />
          </button>
        </AuthFlowShell>
      );
    }

    return (
      <AuthFlowShell
        kicker="Reset password"
        heading={
          <>
            Choose a <em>new password</em>
          </>
        }
        sub="Make it 8+ characters with a number, a capital letter, and a symbol."
      >
        <form
          onSubmit={setSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div className="field">
            <label className="field-label">New password</label>
            <input
              className="input"
              type="password"
              value={pw}
              placeholder="••••••••"
              autoFocus
              onChange={(e) => setPw(e.target.value)}
            />
            <div className="strength-meter">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  style={
                    strength >= n
                      ? {
                          background:
                            strength === 1
                              ? "oklch(0.6 0.16 35)"
                              : strength === 2
                              ? "var(--accent)"
                              : "oklch(0.55 0.13 150)",
                        }
                      : undefined
                  }
                />
              ))}
            </div>
            {errors.pw && <span className="flow-err">{errors.pw}</span>}
          </div>
          <div className="field">
            <label className="field-label">Confirm password</label>
            <input
              className="input"
              type="password"
              value={pw2}
              placeholder="••••••••"
              onChange={(e) => setPw2(e.target.value)}
            />
            {errors.pw2 && <span className="flow-err">{errors.pw2}</span>}
          </div>
          {serverError && <span className="flow-err">{serverError}</span>}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ justifyContent: "center" }}
            disabled={busy || !canUpdate}
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </AuthFlowShell>
    );
  }

  // success
  return (
    <AuthFlowShell
      kicker="Reset password"
      heading={
        <>
          Password <em>updated</em>
        </>
      }
      sub="Your password has been changed. You can now sign in with your new credentials."
    >
      <div style={{ textAlign: "center" }}>
        <div className="flow-seal">
          <Check size={26} />
        </div>
        <button
          className="btn btn-primary btn-lg"
          style={{ margin: "18px auto 0", justifyContent: "center" }}
          onClick={() => navigate("/login")}
        >
          Continue to sign in <ArrowRight size={15} />
        </button>
      </div>
    </AuthFlowShell>
  );
}

export default ResetPasswordFlow;
