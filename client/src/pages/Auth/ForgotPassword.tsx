import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import './Auth.css';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const resetToken = res.data?.resetToken;
      showToast(res.data?.message || 'If that account exists, check email for reset instructions', 'success');

      // For development/demo show the reset link in UI (navigate to reset with token)
      if (resetToken) {
        // Navigate to reset page with token in query string
        navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Could not send reset instructions', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-icon">🏠</span>
              <h1>NeighborFit</h1>
            </div>
            <h2>Reset Your Password</h2>
            <p>Enter your email and we'll send reset instructions.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
