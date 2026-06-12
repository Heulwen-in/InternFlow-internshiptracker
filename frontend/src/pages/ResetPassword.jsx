import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import AuthShell from "../components/AuthShell";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const token = searchParams.get("token") || "";

  useEffect(() => {
    const validateToken = async () => {
      setIsCheckingLink(true);
      setError("");
      if (!token) {
        setIsLinkExpired(true);
        setError("This link has been expired");
        setIsCheckingLink(false);
        return;
      }
      try {
        await api.post("/auth/validate-reset-token", { token });
        setIsLinkExpired(false);
      } catch (err) {
        setIsLinkExpired(true);
        setError(err.response?.data?.message || "This link has been expired");
      } finally {
        setIsCheckingLink(false);
      }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/reset-password", { token, password });
      setMessage(res.data.message);
      setPassword("");
      setIsLinkExpired(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <AuthShell
      tagline="Your reset link expires after 5 minutes."
      onSubmit={handleSubmit}
      footer={
        <>
          Back to <Link to="/login">sign in</Link>
        </>
      }
    >
      {message && <div className="auth-note">{message}</div>}
      {isCheckingLink && (
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          Checking reset link…
        </span>
      )}

      <div className="field">
        <label className="field-label">New password</label>
        <input
          className="input"
          type="password"
          minLength="8"
          value={password}
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isCheckingLink || isLinkExpired}
        />
      </div>

      {error && <span className="auth-err">{error}</span>}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ marginTop: 4 }}
        disabled={isCheckingLink || isLinkExpired}
      >
        Reset password
      </button>
    </AuthShell>
  );
}

export default ResetPassword;
