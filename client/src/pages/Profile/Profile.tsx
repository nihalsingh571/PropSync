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
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  const [profileData, setProfileData] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    createdAt: ''
  });
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
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