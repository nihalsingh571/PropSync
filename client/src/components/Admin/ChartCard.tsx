import React from 'react';
import './admin.css';

interface ChartCardProps {
  title: string;
  actionSlot?: React.ReactNode;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, actionSlot, children }) => (
  <div className="admin-chart-card">
    <div className="admin-chart-card__header">
      <h3>{title}</h3>
      {actionSlot}
    </div>
    <div className="admin-chart-card__body">{children}</div>
  </div>
);

export default ChartCard;
