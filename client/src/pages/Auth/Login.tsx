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
  const { login, verify2FA } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code2FA, setCode2FA] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleRedirect = () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const primaryRole = getPrimaryRole(storedUser);
    const destination = (primaryRole && ROLE_REDIRECTS[primaryRole]) || '/dashboard';
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(formData.email, formData.password);
      if (res && res.require2FA) {
        setRequire2FA(true);
        setTempToken(res.tempToken || '');
        setError('');
        setLoading(false);
        showToast('Google Authenticator verification required', 'info');
        return;
      }
      showToast('Welcome back to PropSync!', 'success');
      handleRedirect();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FA(code2FA, tempToken);
      showToast('Welcome back to PropSync!', 'success');
      handleRedirect();
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

          {require2FA ? (
            <form onSubmit={handleVerify2FA} className="auth-form" noValidate>
              {error && (
                <div className="auth-error-box">
                  <span className="auth-error-icon">⚠️</span>
                  <div>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="2fa-code" className="form-label">Google Authenticator Code</label>
                <input
                  type="text"
                  id="2fa-code"
                  name="code2FA"
                  value={code2FA}
                  onChange={e => {
                    setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (error) setError('');
                  }}
                  className="form-input"
                  placeholder="000000"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  disabled={loading}
                  style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full auth-submit-btn"
                disabled={loading || code2FA.length !== 6}
              >
                {loading ? (
                  <><div className="btn-spinner"></div>Verifying...</>
                ) : 'Verify Code'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                style={{ marginTop: '0.5rem', background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: '#cbd5e1', width: '100%', height: '42px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                onClick={() => {
                  setRequire2FA(false);
                  setCode2FA('');
                  setTempToken('');
                  setError('');
                }}
                disabled={loading}
              >
                ← Back to Login
              </button>
            </form>
          ) : (
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
          )}

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
