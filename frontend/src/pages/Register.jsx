import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AuthShell from "../components/AuthShell";
import PasswordInput from "../components/PasswordInput";

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const passwordRules = [
    { label: "More than 8 characters", isValid: form.password.length > 8 },
    { label: "At least one number", isValid: /\d/.test(form.password) },
    { label: "At least one capital letter", isValid: /[A-Z]/.test(form.password) },
    {
      label: "At least one special character",
      isValid: /[^A-Za-z0-9]/.test(form.password),
    },
  ];

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const isPasswordStrong = passwordRules.every((rule) => rule.isValid);
  const canSubmit = isPasswordStrong && passwordsMatch;

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!canSubmit) {
      setError("Please complete all password requirements before registering.");
      return;
    }
    try {
      await register(form.name, form.email, form.password);
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <AuthShell
      tagline="Create your account to start tracking."
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <div className="field">
        <label className="field-label">Name</label>
        <input
          className="input"
          value={form.name}
          placeholder="Maya Okafor"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="field">
        <label className="field-label">Email</label>
        <input
          className="input"
          type="email"
          value={form.email}
          placeholder="you@school.edu"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div className="field">
        <label className="field-label">Password</label>
        <PasswordInput
          value={form.password}
          placeholder="••••••••"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>

      <ul className="password-rules" aria-label="Password requirements">
        {passwordRules.map((rule) => (
          <li key={rule.label} data-valid={rule.isValid}>
            <span aria-hidden="true">{rule.isValid ? "✓" : "○"}</span>
            {rule.label}
          </li>
        ))}
      </ul>

      <div className="field">
        <label className="field-label">Confirm password</label>
        <PasswordInput
          value={form.confirmPassword}
          placeholder="••••••••"
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
      </div>

      {form.confirmPassword && (
        <span
          className="auth-err"
          style={{
            color: passwordsMatch ? "oklch(var(--st-l) 0.1 155)" : undefined,
          }}
        >
          {passwordsMatch ? "✓ Passwords match" : "○ Passwords do not match"}
        </span>
      )}

      {error && <span className="auth-err">{error}</span>}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ marginTop: 4 }}
        disabled={!canSubmit}
      >
        Create account
      </button>
    </AuthShell>
  );
}

export default Register;
