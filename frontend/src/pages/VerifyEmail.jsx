import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AuthShell from "../components/AuthShell";

function VerifyEmail() {
  const { verifyEmail, resendVerification, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState(searchParams.get("otp") || "");
  const [message, setMessage] = useState("Check your email for the 6-digit code.");
  const [error, setError] = useState("");
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);

  useEffect(() => {
    const linkEmail = searchParams.get("email");
    const linkOtp = searchParams.get("otp");
    if (!linkEmail || !linkOtp) return;

    const verifyLink = async () => {
      setIsVerifyingLink(true);
      setError("");
      try {
        await verifyEmail(linkEmail, linkOtp);
        navigate("/dashboard");
      } catch (err) {
        setError(err.response?.data?.message || "Email verification failed");
      } finally {
        setIsVerifyingLink(false);
      }
    };
    verifyLink();
  }, [navigate, searchParams, verifyEmail]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await verifyEmail(email, otp);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Email verification failed");
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const res = await resendVerification(email);
      setMessage(res.message || "Verification code sent");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification code");
    }
  };

  return (
    <AuthShell
      tagline="Verify your email to finish signing up."
      onSubmit={handleSubmit}
      footer={
        <>
          Already verified? <Link to="/login">Sign in</Link>
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
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label className="field-label">Verification code</label>
        <input
          className="input"
          inputMode="numeric"
          maxLength="6"
          value={otp}
          placeholder="000000"
          onChange={(e) => setOtp(e.target.value)}
          required
        />
      </div>

      {error && <span className="auth-err">{error}</span>}

      <button type="submit" className="btn btn-primary" disabled={isVerifyingLink}>
        {isVerifyingLink ? "Checking link…" : "Verify account"}
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ alignSelf: "center", color: "var(--muted)" }}
        onClick={handleResend}
      >
        Resend code
      </button>
    </AuthShell>
  );
}

export default VerifyEmail;
