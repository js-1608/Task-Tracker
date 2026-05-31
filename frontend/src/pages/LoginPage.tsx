// client/src/pages/LoginPage.tsx
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Layers size={20} color="#ffffff" />
          </div>
          <h1>Sign in to your account</h1>
          <p>Access your team's TaskTracker board</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderTopColor: '#ffffff' }} /> : <LogIn size={15} />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          New to TaskTracker?{' '}
          <Link to="/register">Create a workspace</Link>
        </div>

        <hr className="divider" />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Demo Account:</strong>
          <div style={{ marginTop: '2px', fontFamily: 'monospace' }}>admin@demo.com / Admin123</div>
        </div>
      </div>
    </div>
  );
}
