import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AuthFlowShell from "../components/AuthFlowShell";

const LEN = 6;

function VerifyEmail() {
  const { verifyEmail, resendVerification, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const linkOtp = (searchParams.get("otp") || "").replace(/\D/g, "").slice(0, LEN);

  const [digits, setDigits] = useState(() => {
    const arr = Array(LEN).fill("");
    if (linkOtp.length === LEN) linkOtp.split("").forEach((c, i) => (arr[i] = c));
    return arr;
  });
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);
  const refs = useRef([]);

  const code = digits.join("");

  const doVerify = useCallback(
    async (value) => {
      setBusy(true);
      setError("");
      try {
        await verifyEmail(email, value);
        navigate("/dashboard");
      } catch (err) {
        setError(err.response?.data?.message || "Email verification failed");
        setBusy(false);
      }
    },
    [email, navigate, verifyEmail]
  );

  // Auto-verify when arriving from an email deep-link (?email=&otp=).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (email && linkOtp.length === LEN) doVerify(linkOtp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const setAt = (i, v) =>
    setDigits((cur) => {
      const n = [...cur];
      n[i] = v;
      return n;
    });

  const handleChange = (i, raw) => {
    const v = raw.replace(/\D/g, "");
    setError("");
    if (!v) {
      setAt(i, "");
      return;
    }
    if (v.length === 1) {
      setAt(i, v);
      if (i < LEN - 1) refs.current[i + 1]?.focus();
    } else {
      const chars = v.slice(0, LEN - i).split("");
      setDigits((cur) => {
        const n = [...cur];
        chars.forEach((c, k) => (n[i + k] = c));
        return n;
      });
      const next = Math.min(i + chars.length, LEN - 1);
      refs.current[next]?.focus();
    }
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const submit = (e) => {
    e.preventDefault();
    if (code.length < LEN) {
      setError("Enter all 6 digits of your code.");
      return;
    }
    doVerify(code);
  };

  const resend = async () => {
    if (!email) {
      setError("Missing email address. Please register again.");
      return;
    }
    setError("");
    try {
      await resendVerification(email);
      setSeconds(45);
      setResent(true);
      setDigits(Array(LEN).fill(""));
      refs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification code");
    }
  };

  return (
    <AuthFlowShell
      kicker="Verify your email"
      heading={
        <>
          Confirm your <em>email address</em>
        </>
      }
      sub={
        <>
          We sent a 6-digit code to <b>{email || "your inbox"}</b>. Enter it below to
          finish setting up your account.
        </>
      }
      backTo="/login"
      footer={
        <div className="flow-note">
          {seconds > 0 ? (
            <>
              Didn&apos;t get it? Resend in{" "}
              <b style={{ color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>
                0:{String(seconds).padStart(2, "0")}
              </b>
            </>
          ) : (
            <>
              Didn&apos;t get it? <button onClick={resend}>Resend code</button>
            </>
          )}
          {resent && seconds > 40 && (
            <div style={{ marginTop: 6, color: "var(--accent)", fontSize: 12.5 }}>
              A new code is on its way.
            </div>
          )}
        </div>
      }
    >
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          className="otp-row"
          onPaste={(e) => {
            const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
            if (t) {
              e.preventDefault();
              handleChange(0, t);
            }
          }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              className={"otp-box" + (d ? " filled" : "")}
              type="text"
              inputMode="numeric"
              maxLength={i === 0 ? LEN : 1}
              value={d}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
            />
          ))}
        </div>
        {error && (
          <span className="flow-err" style={{ textAlign: "center" }}>
            {error}
          </span>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={code.length < LEN || busy}
          style={{ justifyContent: "center" }}
        >
          {busy ? "Verifying…" : "Verify email"}
        </button>
      </form>
    </AuthFlowShell>
  );
}

export default VerifyEmail;
