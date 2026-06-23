import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getPrimaryRole, getRoleLabel } from '../../contexts/AuthContext';
import './Dashboard.css';

// ── PropSync Dashboard ─────────────────────────────────────────────────────────
// This is a role-aware landing page. Each role sees their relevant quick-actions.
// Full per-role dashboards will be built in Phases 4–7.

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard-page">
      <div className="container">

        {/* ── Welcome Header ──────────────────────────────────────────────── */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p>
              You're logged in as{' '}
              <span className="role-pill role-pill--{primaryRole}">{getRoleLabel(primaryRole)}</span>
            </p>
          </div>
        </div>

        {/* ── Role-Based Quick Actions ────────────────────────────────────── */}
        <div className="dashboard-content">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="actions-grid">
              {getQuickActions(primaryRole).map((action, i) => (
                <Link key={i} to={action.to} className="action-card">
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-content">
                    <h3>{action.title}</h3>
                    <p>{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Coming Soon Banner ──────────────────────────────────────────── */}
          <div className="dashboard-section">
            <div className="coming-soon-banner">
              <div className="coming-soon-icon">🚀</div>
              <div>
                <h3>Your full {getRoleLabel(primaryRole)} dashboard is coming soon</h3>
                <p>We're building rich analytics, request tracking, and real-time updates for your role.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Role → Quick Actions Mapping ──────────────────────────────────────────────
type Action = { icon: string; title: string; desc: string; to: string };

const getQuickActions = (role: string | null): Action[] => {
  switch (role) {
    case 'admin':
      return [
        { icon: '🛡️', title: 'Admin Panel', desc: 'Manage users and platform settings', to: '/admin' },
        { icon: '👥', title: 'User Management', desc: 'View and manage all user accounts', to: '/admin/users' },
        { icon: '📊', title: 'Analytics', desc: 'View platform-wide analytics', to: '/admin/analytics' },
        { icon: '⚙️', title: 'Settings', desc: 'Configure system settings', to: '/admin/settings' }
      ];
    case 'property_owner':
      return [
        { icon: '🏠', title: 'My Properties', desc: 'View and manage your properties', to: '/properties' },
        { icon: '👥', title: 'Tenants', desc: 'View all your tenants', to: '/tenants' },
        { icon: '🔧', title: 'Maintenance', desc: 'Track maintenance requests', to: '/maintenance' },
        { icon: '🏊', title: 'Amenities', desc: 'Manage property amenities', to: '/amenities' }
      ];
    case 'maintenance_staff':
      return [
        { icon: '📋', title: 'My Jobs', desc: 'View jobs assigned to you', to: '/maintenance/my-jobs' },
        { icon: '✅', title: 'Completed Jobs', desc: 'Review completed maintenance', to: '/maintenance/completed' },
        { icon: '👤', title: 'My Profile', desc: 'Update your profile', to: '/profile' }
      ];
    case 'tenant':
    default:
      return [
        { icon: '🔧', title: 'Maintenance Requests', desc: 'Submit or track a maintenance request', to: '/maintenance' },
        { icon: '📅', title: 'Book Amenity', desc: 'Reserve gym, pool, or meeting room', to: '/amenities' },
        { icon: '🔔', title: 'Notifications', desc: 'View your latest updates', to: '/notifications' },
        { icon: '👤', title: 'My Profile', desc: 'Update your account details', to: '/profile' }
      ];
  }
};

export default Dashboard;
