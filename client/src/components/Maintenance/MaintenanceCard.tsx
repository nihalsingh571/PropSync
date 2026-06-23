import React from 'react';
import type { MaintenanceRequest } from '../../lib/maintenanceApi';
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_LABELS } from '../../lib/maintenanceApi';
import './Maintenance.css';

interface MaintenanceCardProps {
  request: MaintenanceRequest;
  onClick?: () => void;
  onStatusChange?: (id: string, status: string) => void;
  compact?: boolean;
}

const MaintenanceCard: React.FC<MaintenanceCardProps> = ({ request, onClick, compact = false }) => {
  const tenant = typeof request.tenantId === 'object' ? request.tenantId : null;
  const property = typeof request.propertyId === 'object' ? request.propertyId : null;
  const assigned = request.assignedTo;
  const statusCfg = STATUS_CONFIG[request.status];
  const priorityCfg = PRIORITY_CONFIG[request.priority];
  const age = Math.floor((Date.now() - new Date(request.createdAt).getTime()) / 86_400_000);

  return (
    <div className={`maint-card ${compact ? 'maint-card--compact' : ''} priority-${request.priority}`} onClick={onClick}>
      {/* ── Priority Strip ─────────────────────────────────────────────────── */}
      <div className="maint-card__priority-strip" style={{ background: priorityCfg.color }} />

      <div className="maint-card__body">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="maint-card__header">
          <div className="maint-card__category">
            {CATEGORY_LABELS[request.category] ?? request.category}
          </div>
          <div className="maint-card__badges">
            <span className="priority-badge" style={{ color: priorityCfg.color, background: priorityCfg.bg }}>
              {priorityCfg.label}
            </span>
            <span className={`shared-badge ${statusCfg.cls}`}>{statusCfg.label}</span>
          </div>
        </div>

        {/* ── Title ─────────────────────────────────────────────────────────── */}
        <h3 className="maint-card__title">{request.title}</h3>

        {!compact && (
          <p className="maint-card__desc">{request.description.slice(0, 120)}{request.description.length > 120 && '…'}</p>
        )}

        {/* ── Meta ──────────────────────────────────────────────────────────── */}
        <div className="maint-card__meta">
          {property && (
            <span className="meta-item">🏢 {property.name} · Unit {request.unitNumber}</span>
          )}
          {tenant && (
            <span className="meta-item">👤 {tenant.name}</span>
          )}
          {assigned && typeof assigned === 'object' && (
            <span className="meta-item">🔧 {assigned.name}</span>
          )}
          <span className="meta-item">📅 {age === 0 ? 'Today' : `${age}d ago`}</span>
          {request.timeline.length > 1 && (
            <span className="meta-item">🕐 {request.timeline.length} updates</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCard;
