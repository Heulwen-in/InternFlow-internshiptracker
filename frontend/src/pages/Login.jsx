import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AuthShell from "../components/AuthShell";
import PasswordInput from "../components/PasswordInput";

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <AuthShell
      tagline="Welcome back. Your pipeline is waiting."
      onSubmit={handleSubmit}
      footer={
        <>
          New to InternFlow? <Link to="/register">Create account</Link>
        </>
      }
    >
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

      {error && <span className="auth-err">{error}</span>}

      <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
        Sign in
      </button>

      <Link
        to="/forgot-password"
        className="btn btn-ghost btn-sm"
        style={{ alignSelf: "center", color: "var(--muted)" }}
      >
        Forgot password?
      </Link>
    </AuthShell>
  );
}

export default Login;
