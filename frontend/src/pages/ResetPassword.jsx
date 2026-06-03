import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";

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
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Choose new password</h1>
        <p>Your reset link expires after 5 minutes.</p>

        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
        {isCheckingLink && <p className="muted">Checking reset link...</p>}

        <label>
          New password
          <input
            type="password"
            minLength="8"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isCheckingLink || isLinkExpired}
          />
        </label>

        <button type="submit" disabled={isCheckingLink || isLinkExpired}>
          Reset Password
        </button>

        <span>
          Back to <Link to="/login">login</Link>
        </span>
      </form>
    </main>
  );
}

export default ResetPassword;
