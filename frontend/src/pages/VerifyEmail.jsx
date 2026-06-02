import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";

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
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Verify email</h1>
        <p>{message}</p>

        {error && <div className="alert">{error}</div>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Verification code
          <input
            inputMode="numeric"
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={isVerifyingLink}>
          {isVerifyingLink ? "Checking Link..." : "Verify Account"}
        </button>

        <button type="button" className="button-ghost" onClick={handleResend}>
          Resend Code
        </button>

        <span>
          Already verified? <Link to="/login">Login</Link>
        </span>
      </form>
    </main>
  );
}

export default VerifyEmail;
