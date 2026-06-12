import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import AuthShell from "../components/AuthShell";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
    }
  };

  return (
    <AuthShell
      tagline="Enter your account email and we'll send a reset link."
      onSubmit={handleSubmit}
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {message && <div className="auth-note">{message}</div>}

      <div className="field">
        <label className="field-label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          placeholder="you@school.edu"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {error && <span className="auth-err">{error}</span>}

      <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
        Send reset link
      </button>
    </AuthShell>
  );
}

export default ForgotPassword;
