import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/reset-password", { token, password });
      setMessage(res.data.message);
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Choose new password</h1>
        <p>Your reset link expires after 30 minutes.</p>

        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}

        {!token && <div className="alert">Missing password reset token.</div>}

        <label>
          New password
          <input
            type="password"
            minLength="8"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={!token}>
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
