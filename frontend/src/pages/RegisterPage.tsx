// client/src/pages/RegisterPage.tsx
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.orgName, form.name, form.email, form.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
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
          <h1>Create your workspace</h1>
          <p>Get started with Atlassian-style task boards</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="orgName">Organization name</label>
            <input id="orgName" type="text" placeholder="e.g. Acme Corporation" value={form.orgName}
              onChange={set('orgName')} required autoFocus />
          </div>

          <div className="form-group">
            <label htmlFor="name">Your full name</label>
            <input id="name" type="text" placeholder="e.g. Jane Doe" value={form.name}
              onChange={set('name')} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Work email</label>
            <input id="email" type="email" placeholder="e.g. jane@company.com" value={form.email}
              onChange={set('email')} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.password} onChange={set('password')} required />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderTopColor: '#ffffff' }} /> : <Sparkles size={14} />}
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </button>
        </form>

        <div className="auth-footer">
          Already have a TaskTracker account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
