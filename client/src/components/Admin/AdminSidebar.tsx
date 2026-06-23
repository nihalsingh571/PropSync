import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import './admin.css';

// Phase 4+: Properties, Tenants added
// Phase 6+: Maintenance added
// Phase 7+: Amenities added
// Phase 8+: Bookings added
const navItems = [
  { label: 'Dashboard', path: '/admin', icon: '🏠', exact: true },
  { label: 'Users', path: '/admin/users', icon: '👥' },
  { label: 'Properties', path: '/admin/properties', icon: '🏢' },
  // Phase 5: { label: 'Tenants', path: '/admin/tenants', icon: '🙋' },
  // Phase 6: { label: 'Maintenance', path: '/admin/maintenance', icon: '🔧' },
  // Phase 7: { label: 'Amenities', path: '/admin/amenities', icon: '🏊' },
  // Phase 8: { label: 'Bookings', path: '/admin/bookings', icon: '📅' },
  { label: 'Analytics', path: '/admin/analytics', icon: '📈' },
  { label: 'Settings', path: '/admin/settings', icon: '⚙️' }
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();

  return (
    <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="admin-sidebar__brand">
        <span className="logo-icon">🏢</span>
        {!sidebarCollapsed && (
          <div className="logo-text-group">
            <span className="logo-text">PropSync</span>
            <span className="logo-subtitle">Admin</span>
          </div>
        )}
      </div>
      <button className="admin-sidebar__toggle" onClick={toggleSidebar}>
        {sidebarCollapsed ? '›' : '‹'}
      </button>
      <nav className="admin-sidebar__nav">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-sidebar__link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
