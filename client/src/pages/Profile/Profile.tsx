import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './Profile.css';

interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
}

interface UserPreferences {
  lifestyle: {
    safety: number;
    affordability: number;
    cleanliness: number;
    walkability: number;
    nightlife: number;
    transport: number;
  };
  demographics: {
    age: number;
    occupation: string;
    familyStatus: string;
    budget: {
      min: number;
      max: number;
    };
  };
  location: {
    currentCity: string;
    preferredCities: string[];
    maxCommuteTime: number;
  };
}

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  const [profileData, setProfileData] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    createdAt: ''
  });
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // ── Two-Factor Authentication States ──
  const [setup2FAData, setSetup2FAData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [stats, setStats] = useState({
    totalMatches: 0,
    profileViews: 0,
    savedNeighborhoods: 0,
    reviewsWritten: 0
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user preferences
      try {
        const preferencesResponse = await api.get('/preferences');
        setPreferences(preferencesResponse.data);
      } catch (err) {
        console.log('No preferences found');
      }
      
      // Mock stats for now (you can implement these endpoints later)
      setStats({
        totalMatches: 25,
        profileViews: 142,
        savedNeighborhoods: 8,
        reviewsWritten: 3
      });
      
      // Set profile creation date (mock for now)
      setProfileData(prev => ({
        ...prev,
        createdAt: '2024-01-15T00:00:00.000Z'
      }));
      
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      const msg = 'Failed to load profile data';

      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call for profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      const msg = 'Profile updated successfully!';
      showToast(msg, 'success');
    } catch (err: any) {
      const msg = 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);

    try {
      // Mock API call for password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Password changed successfully!', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      const msg = 'Failed to change password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Two-Factor Authentication Handlers ──
  const handleSetup2FA = async () => {
    setMfaLoading(true);
    try {
      const { data } = await api.post('/auth/setup-2fa');
      setSetup2FAData(data);
      setShowSetup(true);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to start 2FA setup', 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    try {
      await api.post('/auth/enable-2fa', { code: verificationCode });
      showToast('Google Authenticator enabled successfully!', 'success');
      updateUser({ twoFactorEnabled: true });
      setShowSetup(false);
      setSetup2FAData(null);
      setVerificationCode('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid verification code', 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    try {
      await api.post('/auth/disable-2fa', { password: disablePassword });
      showToast('Google Authenticator disabled successfully!', 'success');
      updateUser({ twoFactorEnabled: false });
      setShowDisable(false);
      setDisablePassword('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid password', 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setLoading(true);
        // Mock API call for account deletion
        await new Promise(resolve => setTimeout(resolve, 1000));
        logout();
      } catch (err: any) {
        const msg = 'Failed to delete account';
        showToast(msg, 'error');
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLifestyleLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      safety: 'Safety & Security',
      affordability: 'Affordability',
      cleanliness: 'Cleanliness',
      walkability: 'Walkability',
      nightlife: 'Nightlife & Entertainment',
      transport: 'Public Transport'
    };
    return labels[key] || key;
  };

  if (loading && !preferences) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <h1>{user?.name}</h1>
              <p className="profile-email">{user?.email}</p>
              <p className="profile-joined">
                Member since {formatDate(profileData.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-number">{stats.totalMatches}</div>
              <div className="stat-label">Matches Found</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.savedNeighborhoods}</div>
              <div className="stat-label">Saved Areas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.reviewsWritten}</div>
              <div className="stat-label">Reviews</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Settings
          </button>
          <button
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            My Preferences
          </button>
          <button
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data & Privacy
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">


          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="profile-content">
              <div className="content-section">
                <h2>Personal Information</h2>
                <form onSubmit={handleProfileUpdate} className="profile-form">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="preferences-content">
              {preferences ? (
                <div className="content-section">
                  <div className="section-header">
                    <h2>Your Lifestyle Preferences</h2>
                    <a href="/preferences" className="btn btn-outline">
                      Edit Preferences
                    </a>
                  </div>
                  
                  <div className="preferences-grid">
                    <div className="preference-card">
                      <h3>Lifestyle Priorities</h3>
                      <div className="lifestyle-list">
                        {Object.entries(preferences.lifestyle).map(([key, value]) => (
                          <div key={key} className="lifestyle-item">
                            <span className="lifestyle-label">
                              {getLifestyleLabel(key)}
                            </span>
                            <div className="lifestyle-bar">
                              <div 
                                className="lifestyle-fill" 
                                style={{ width: `${value * 10}%` }}
                              ></div>
                            </div>
                            <span className="lifestyle-value">{value}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="preference-card">
                      <h3>Demographics</h3>
                      <div className="demo-list">
                        <div className="demo-item">
                          <span className="demo-label">Age</span>
                          <span className="demo-value">{preferences.demographics.age} years</span>
                        </div>
                        <div className="demo-item">
                          <span className="demo-label">Occupation</span>
                          <span className="demo-value">{preferences.demographics.occupation || 'Not specified'}</span>
                        </div>
                        <div className="demo-item">
                          <span className="demo-label">Family Status</span>
                          <span className="demo-value">
                            {preferences.demographics.familyStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="demo-item">
                          <span className="demo-label">Budget Range</span>
                          <span className="demo-value">
                            ₹{preferences.demographics.budget.min.toLocaleString()} - ₹{preferences.demographics.budget.max.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="preference-card">
                      <h3>Location Preferences</h3>
                      <div className="location-list">
                        <div className="location-item">
                          <span className="location-label">Current City</span>
                          <span className="location-value">{preferences.location.currentCity || 'Not specified'}</span>
                        </div>
                        <div className="location-item">
                          <span className="location-label">Preferred Cities</span>
                          <div className="cities-list">
                            {preferences.location.preferredCities.length > 0 ? (
                              preferences.location.preferredCities.map(city => (
                                <span key={city} className="city-tag">{city}</span>
                              ))
                            ) : (
                              <span className="location-value">None selected</span>
                            )}
                          </div>
                        </div>
                        <div className="location-item">
                          <span className="location-label">Max Commute Time</span>
                          <span className="location-value">{preferences.location.maxCommuteTime} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-preferences">
                  <div className="no-preferences-icon">⚙️</div>
                  <h3>No preferences set</h3>
                  <p>Set your lifestyle preferences to get personalized neighborhood matches</p>
                  <a href="/preferences" className="btn btn-primary">
                    Set Preferences
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="security-content">
              <div className="content-section">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange} className="password-form">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="form-input"
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="form-input"
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Google Authenticator (2FA) Section */}
              <div className="content-section" style={{ marginTop: '2rem' }}>
                <h2>Two-Factor Authentication (2FA)</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Protect your account with Google Authenticator. You'll need to enter a 6-digit verification code from the app whenever you log in.
                </p>

                {user?.twoFactorEnabled ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '1.25rem', color: '#10b981' }}>🛡️</span>
                      <div>
                        <strong style={{ display: 'block', color: '#f1f5f9' }}>Google Authenticator is Active</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Your account is protected by two-factor authentication</span>
                      </div>
                    </div>

                    {showDisable ? (
                      <form onSubmit={handleDisable2FA} className="password-form" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ color: '#ef4444' }}>Enter Password to Confirm</label>
                          <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="form-input"
                            required
                            placeholder="Enter your password"
                            disabled={mfaLoading}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                          <button type="submit" className="btn btn-danger" disabled={mfaLoading}>
                            {mfaLoading ? 'Disabling...' : 'Confirm Disable'}
                          </button>
                          <button type="button" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }} onClick={() => { setShowDisable(false); setDisablePassword(''); }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button className="btn btn-danger" onClick={() => setShowDisable(true)}>
                        Disable 2FA
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {!showSetup ? (
                      <button className="btn btn-primary" onClick={handleSetup2FA} disabled={mfaLoading}>
                        {mfaLoading ? 'Loading Setup...' : 'Enable 2FA'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
                        {setup2FAData && (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flex: '1 1 200px' }}>
                              <img src={setup2FAData.qrCodeDataUrl} alt="2FA QR Code" style={{ border: '4px solid white', borderRadius: '8px', width: '160px', height: '160px' }} />
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Scan this QR code in your Google Authenticator or Microsoft Authenticator app.</span>
                            </div>
                            <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: 0 }}>Confirm Setup</h3>
                              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                                Enter the 6-digit verification code generated by your Authenticator app to finalize setup.
                              </p>
                              <form onSubmit={handleEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                  <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="form-input"
                                    placeholder="000000"
                                    required
                                    style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}
                                    disabled={mfaLoading}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                  <button type="submit" className="btn btn-primary" disabled={mfaLoading || verificationCode.length !== 6}>
                                    {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                                  </button>
                                  <button type="button" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }} onClick={() => { setShowSetup(false); setSetup2FAData(null); setVerificationCode(''); }}>
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="data-content">
              <div className="content-section">
                <h2>Data & Privacy</h2>
                
                <div className="data-section">
                  <h3>Account Data</h3>
                  <p>You can download a copy of your account data at any time.</p>
                  <button className="btn btn-outline">
                    Download My Data
                  </button>
                </div>
                
                <div className="data-section">
                  <h3>Privacy Settings</h3>
                  <div className="privacy-options">
                    <label className="privacy-option">
                      <input type="checkbox" defaultChecked />
                      <span>Allow personalized recommendations</span>
                    </label>
                    <label className="privacy-option">
                      <input type="checkbox" defaultChecked />
                      <span>Receive email notifications</span>
                    </label>
                    <label className="privacy-option">
                      <input type="checkbox" />
                      <span>Share anonymous usage data</span>
                    </label>
                  </div>
                </div>
                
                <div className="data-section danger-zone">
                  <h3>Danger Zone</h3>
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                  <button 
                    onClick={handleDeleteAccount}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;