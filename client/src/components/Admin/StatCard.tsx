import React from 'react';
import './admin.css';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, description, trend, icon }) => {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-meta">
        <span className="admin-stat-label">{label}</span>
        {icon && <span className="admin-stat-icon">{icon}</span>}
      </div>
      <div className="admin-stat-value">{value}</div>
      {description && <p className="admin-stat-description">{description}</p>}
      {trend && (
        <div className={`admin-stat-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          {trend.isPositive ? '▲' : '▼'} {trend.value}%
        </div>
      )}
    </div>
  );
};

export default StatCard;
