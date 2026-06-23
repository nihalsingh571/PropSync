import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { PropSyncRole, RegisterPayload } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { EyeIcon, EyeOffIcon } from '../../components/Icons/EyeIcons';
import './Auth.css';

// ── Role options for self-registration ────────────────────────────────────────
const ROLE_OPTIONS: { value: PropSyncRole; label: string; icon: string; desc: string }[] = [
  {
    value: 'tenant',
    label: 'Tenant',
    icon: '🙋',
    desc: 'I rent a property and need to manage requests & bookings'
  },
  {
    value: 'property_owner',
    label: 'Property Owner',
    icon: '🏠',
    desc: 'I own properties and manage tenants & amenities'
  },
  {
    value: 'maintenance_staff',
    label: 'Maintenance Staff',
    icon: '🔧',
    desc: 'I handle maintenance jobs assigned by property managers'
  }
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'tenant' as PropSyncRole
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: role selection, Step 2: details

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const selectRole = (role: PropSyncRole) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const goToStep2 = () => setStep(2);
  const goToStep1 = () => setStep(1);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) { setError('Full name is required'); return false; }
    if (!formData.email.trim()) { setError('Email is required'); return false; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role: formData.role
      };
      await register(payload);
      showToast('Account created successfully! Welcome to PropSync.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = ROLE_OPTIONS.find(r => r.value === formData.role);

  return (
    <div className="auth-page">
      <div className="auth-container auth-container--wide">

        {/* ── Register Card ───────────────────────────────────────────────── */}
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-icon">🏢</span>
              <h1>PropSync</h1>
            </div>
            <h2>Create Your Account</h2>
            <p>
              {step === 1
                ? 'Choose your role to get started'
                : `Joining as ${selectedRoleData?.label}`}
            </p>
          </div>

          {/* ── Step Indicator ─────────────────────────────────────────────── */}
          <div className="auth-steps">
            <div className={`auth-step ${step >= 1 ? 'active' : ''}`}>
              <div className="auth-step__dot">1</div>
              <span>Choose Role</span>
            </div>
            <div className="auth-step__line"></div>
            <div className={`auth-step ${step >= 2 ? 'active' : ''}`}>
              <div className="auth-step__dot">2</div>
              <span>Your Details</span>
            </div>
          </div>

          {/* ── Step 1: Role Selection ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="role-selection">
              {ROLE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`role-card-btn ${formData.role === option.value ? 'selected' : ''}`}
                  onClick={() => selectRole(option.value)}
                >
                  <span className="role-card-btn__icon">{option.icon}</span>
                  <div className="role-card-btn__text">
                    <strong>{option.label}</strong>
                    <span>{option.desc}</span>
                  </div>
                  <span className="role-card-btn__check">
                    {formData.role === option.value ? '✓' : ''}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={goToStep2}
              >
                Continue as {selectedRoleData?.label} →
              </button>
            </div>
          )}

          {/* ── Step 2: Account Details ────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {error && (
                <div className="auth-error-box">
                  <span className="auth-error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Selected role badge */}
              <div className="selected-role-badge">
                <span>{selectedRoleData?.icon}</span>
                <span>{selectedRoleData?.label}</span>
                <button type="button" onClick={goToStep1} className="change-role-btn">Change</button>
              </div>

              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="reg-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your full name"
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="reg-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone" className="form-label">
                  Phone Number <span className="form-label-optional">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="reg-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+91-9000000000"
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="At least 6 characters"
                    required
                    disabled={loading}
                    minLength={6}
                    autoComplete="new-password"
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

              <div className="form-group">
                <label htmlFor="reg-confirm-password" className="form-label">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="reg-confirm-password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Repeat your password"
                    required
                    disabled={loading}
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword(p => !p)}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="auth-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={goToStep1}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <><div className="btn-spinner"></div>Creating Account...</>
                  ) : 'Create Account →'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in →</Link>
            </p>
            <p className="auth-terms">
              By creating an account you agree to our{' '}
              <a href="#" className="auth-link">Terms of Service</a>
            </p>
          </div>
        </div>

        {/* ── Side Panel ──────────────────────────────────────────────────── */}
        <div className="auth-side">
          <div className="auth-side__inner">
            <h3>Everything synced, in real-time</h3>
            <p>Join PropSync to manage your property lifecycle from anywhere</p>
            <div className="auth-benefit-list">
              {benefits.map((b, i) => (
                <div key={i} className="auth-benefit-item">
                  <span className="auth-benefit-item__icon">{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const benefits = [
  { icon: '🔧', text: 'Submit & track maintenance requests instantly' },
  { icon: '📅', text: 'Book amenities with conflict-free scheduling' },
  { icon: '🔔', text: 'Real-time notifications for every update' },
  { icon: '📊', text: 'Full analytics dashboard for property owners' },
  { icon: '🔐', text: 'Role-based access — see only what matters' }
];

export default Register;
