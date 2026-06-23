import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path ? 'active' : '';
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Determine role badge
  const getRoleBadge = () => {
    if (!user) return null;
    if (user.roles?.includes('admin')) return { label: 'Admin', color: 'badge--admin' };
    if (user.roles?.includes('property_owner')) return { label: 'Owner', color: 'badge--owner' };
    if (user.roles?.includes('maintenance_staff')) return { label: 'Staff', color: 'badge--staff' };
    if (user.roles?.includes('tenant')) return { label: 'Tenant', color: 'badge--tenant' };
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-icon">🏢</span>
          <span className="logo-name">PropSync</span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation menu */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="navbar-nav">
            <Link to="/" className={`navbar-link ${isActive('/', true)}`} onClick={closeMenu}>
              Home
            </Link>

            {user ? (
              <>
                {/* Dashboard — for all authenticated users */}
                <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard', true)}`} onClick={closeMenu}>
                  Dashboard
                </Link>

                {/* Phase 4: Properties link for owner */}
                {user.roles?.includes('property_owner') && (
                  <Link to="/properties" className={`navbar-link ${isActive('/properties')}`} onClick={closeMenu}>
                    Properties
                  </Link>
                )}

                {/* Phase 5: My Lease link for tenants */}
                {user.roles?.includes('tenant') && (
                  <Link to="/my-lease" className={`navbar-link ${isActive('/my-lease')}`} onClick={closeMenu}>
                    My Lease
                  </Link>
                )}


                {/* Phase 6: Maintenance link for all authenticated roles */}
                {(user.roles?.includes('tenant') || user.roles?.includes('maintenance_staff') || user.roles?.includes('property_owner')) && (
                  <Link to="/maintenance" className={`navbar-link ${isActive('/maintenance')}`} onClick={closeMenu}>
                    Maintenance
                  </Link>
                )}

                {/* Phase 8+: Bookings link for tenants */}
                {/* {user.roles?.includes('tenant') && (
                  <Link to="/my-bookings" className={`navbar-link ${isActive('/my-bookings')}`} onClick={closeMenu}>
                    Bookings
                  </Link>
                )} */}

                {/* Admin portal */}
                {user.roles?.includes('admin') && (
                  <Link to="/admin" className={`navbar-link ${isActive('/admin')}`} onClick={closeMenu}>
                    Admin Portal
                  </Link>
                )}

                {/* User menu */}
                <div className="navbar-user">
                  <div className="user-info">
                    <span className="user-avatar">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                    <div className="user-meta">
                      <span className="user-name">{user.name || 'User'}</span>
                      {roleBadge && (
                        <span className={`user-role-badge ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="user-dropdown">
                    <Link to="/profile" className="dropdown-link" onClick={closeMenu}>
                      👤 Profile
                    </Link>
                    {/* Phase 9+: <Link to="/notifications" className="dropdown-link" onClick={closeMenu}>🔔 Notifications</Link> */}
                    <button onClick={handleLogout} className="dropdown-link logout-btn">
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="navbar-auth">
                <Link to="/login" className={`navbar-link ${isActive('/login', true)}`} onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/register" className="navbar-cta" onClick={closeMenu}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
