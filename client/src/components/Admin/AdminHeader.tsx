import React from 'react';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminDateRange } from '../../stores/adminStore';
import { useAuth } from '../../contexts/AuthContext';
import './admin.css';

interface AdminHeaderProps {
  title: string;
  onRangeChange?: (range: AdminDateRange) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
}

const ranges: { label: string; value: AdminDateRange }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' }
];

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, onRangeChange, onRefresh, isRefreshing, lastUpdated }) => {
  const { user } = useAuth();
  const { dateRange, setDateRange, theme, setTheme } = useAdminStore();

  const handleRangeClick = (value: AdminDateRange) => {
    setDateRange(value);
    onRangeChange?.(value);
  };

  return (
    <header className="admin-header">
      <div>
        <h1>{title}</h1>
        <p>Monitoring platform performance in real-time</p>
      </div>
      <div className="admin-header__actions">
        <div className="admin-header__ranges">
          {ranges.map((range) => (
            <button
              key={range.value}
              className={range.value === dateRange ? 'active' : ''}
              onClick={() => handleRangeClick(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
        {onRefresh && (
          <button
            className="admin-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
        {lastUpdated && (
          <span className="admin-last-updated">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <button
          className="admin-theme-toggle"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="admin-header__user">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
