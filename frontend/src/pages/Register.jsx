import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

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
    {
      label: "More than 8 characters",
      isValid: form.password.length > 8,
    },
    {
      label: "At least one number",
      isValid: /\d/.test(form.password),
    },
    {
      label: "At least one capital letter",
      isValid: /[A-Z]/.test(form.password),
    },
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
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <p>Start tracking internships, deadlines, and interview progress.</p>

        {error && <div className="alert">{error}</div>}

        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>

        <ul className="password-rules" aria-label="Password requirements">
          {passwordRules.map((rule) => (
            <li key={rule.label} data-valid={rule.isValid}>
              <span aria-hidden="true">{rule.isValid ? "✓" : "○"}</span>
              {rule.label}
            </li>
          ))}
        </ul>

        <label>
          Confirm password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
        </label>

        {form.confirmPassword && (
          <p className={passwordsMatch ? "password-match" : "password-mismatch"}>
            {passwordsMatch ? "✓ Passwords match" : "○ Passwords do not match"}
          </p>
        )}

        <button type="submit" disabled={!canSubmit}>
          Register
        </button>

        <span>
          Already have an account? <Link to="/login">Login</Link>
        </span>
      </form>
    </main>
  );
}

export default Register;
