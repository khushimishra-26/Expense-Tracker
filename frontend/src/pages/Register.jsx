import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import AuthBrand from "../components/AuthBrand";

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await api("/users/register", {
        method: "POST",
        body: { username: form.username, email: form.email, password: form.password },
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthBrand />
      <div className="auth-panel">
        <form className="card auth-card" onSubmit={handleSubmit}>
          <h2 className="auth-title">Create account</h2>
          {error && <p className="error">{error}</p>}

          <label>
            Username
            <input name="username" value={form.username} onChange={update} required minLength={3} maxLength={30} autoComplete="username" />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={update} required autoComplete="email" />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={update} required minLength={8} maxLength={72} autoComplete="new-password" />
          </label>
          <label>
            Confirm password
            <input name="confirm" type="password" value={form.confirm} onChange={update} required autoComplete="new-password" />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Register"}
          </button>
          <p className="muted">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
