import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import AuthBrand from "../components/AuthBrand";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/");
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
          <h2 className="auth-title">Welcome back</h2>
          {location.state?.registered && (
            <p className="success">Account created. Please log in.</p>
          )}
          {error && <p className="error">{error}</p>}

          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Login"}
          </button>
          <p className="muted">
            No account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
