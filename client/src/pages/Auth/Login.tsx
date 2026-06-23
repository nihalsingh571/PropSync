import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getPrimaryRole } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { EyeIcon, EyeOffIcon } from '../../components/Icons/EyeIcons';
import './Auth.css';

// Role-based redirect destinations
const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/admin',
  property_owner: '/dashboard',
  tenant: '/dashboard',
  maintenance_staff: '/dashboard'
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      showToast('Welcome back to PropSync!', 'success');

      // Role-based redirect — read from the user state after login resolves
      // We pull role from the JWT response via AuthContext
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const primaryRole = getPrimaryRole(storedUser);
      const destination = (primaryRole && ROLE_REDIRECTS[primaryRole]) || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* ── Login Card ──────────────────────────────────────────────────── */}
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-icon">🏢</span>
              <h1>PropSync</h1>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to manage your properties, requests & bookings</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && (
              <div className="auth-error-box">
                <span className="auth-error-icon">⚠️</span>
                <div>
                  <span>{error}</span>
                  {error.toLowerCase().includes('invalid') && (
                    <Link to="/forgot-password" className="auth-link auth-error-link">
                      Reset password →
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email Address</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label">Password</label>
                <Link to="/forgot-password" className="auth-link form-label-link">Forgot password?</Link>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full auth-submit-btn"
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <><div className="btn-spinner"></div>Signing In...</>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create account →</Link>
            </p>
          </div>
        </div>

        {/* ── Side Panel ──────────────────────────────────────────────────── */}
        <div className="auth-side">
          <div className="auth-side__inner">
            <h3>One platform, every role</h3>
            <p>PropSync connects your entire property ecosystem in real-time</p>
            <div className="auth-role-list">
              {sideRoles.map(item => (
                <div key={item.role} className="auth-role-item">
                  <span className="auth-role-item__icon">{item.icon}</span>
                  <div>
                    <strong>{item.role}</strong>
                    <span>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const sideRoles = [
  { icon: '🛡️', role: 'Admin', desc: 'Full platform oversight & management' },
  { icon: '🏠', role: 'Property Owner', desc: 'Manage properties, tenants & amenities' },
  { icon: '🙋', role: 'Tenant', desc: 'Submit requests, book amenities' },
  { icon: '🔧', role: 'Maintenance Staff', desc: 'View & update assigned jobs' }
];

export default Login;
