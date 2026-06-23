import React from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../../lib/propertyApi';
import './Property.css';

interface PropertyCardProps {
  property: Property;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const statusConfig = {
  active: { label: 'Active', color: 'status--active' },
  inactive: { label: 'Inactive', color: 'status--inactive' },
  under_maintenance: { label: 'Maintenance', color: 'status--maintenance' }
};

const typeIcons: Record<string, string> = {
  apartment: '🏢',
  villa: '🏡',
  commercial: '🏬',
  'co-living': '🏠',
  independent_house: '🏘️'
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onDelete, showActions = true }) => {
  const statusInfo = statusConfig[property.status] ?? statusConfig.active;
  const icon = typeIcons[property.type] ?? '🏠';
  const ownerName = typeof property.ownerId === 'object' ? property.ownerId.name : null;

  return (
    <div className="property-card">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="property-card__header">
        <div className="property-card__icon">{icon}</div>
        <div className="property-card__meta">
          <h3 className="property-card__name">{property.name}</h3>
          <p className="property-card__address">
            📍 {property.address.street}, {property.address.city}, {property.address.state}
          </p>
          {ownerName && (
            <p className="property-card__owner">👤 {ownerName}</p>
          )}
        </div>
        <span className={`status-badge ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>

      {/* ── Occupancy Bar ───────────────────────────────────────────────────── */}
      <div className="property-card__occupancy">
        <div className="occupancy-bar">
          <div
            className="occupancy-bar__fill"
            style={{ width: `${property.occupancyRate ?? 0}%` }}
          />
        </div>
        <div className="occupancy-stats">
          <span><strong>{property.occupiedUnits ?? 0}</strong> occupied</span>
          <span className="occupancy-rate">{property.occupancyRate ?? 0}%</span>
          <span><strong>{property.vacantUnits ?? 0}</strong> vacant</span>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="property-card__stats">
        <div className="prop-stat">
          <span className="prop-stat__num">{property.totalUnits}</span>
          <span className="prop-stat__label">Units</span>
        </div>
        <div className="prop-stat">
          <span className="prop-stat__num">{property.type.replace(/_/g, ' ')}</span>
          <span className="prop-stat__label">Type</span>
        </div>
        {property.yearBuilt && (
          <div className="prop-stat">
            <span className="prop-stat__num">{property.yearBuilt}</span>
            <span className="prop-stat__label">Built</span>
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      {showActions && (
        <div className="property-card__actions">
          <Link to={`/properties/${property._id}`} className="btn-prop btn-prop--primary">
            View Details
          </Link>
          <Link to={`/properties/${property._id}/edit`} className="btn-prop btn-prop--secondary">
            Edit
          </Link>
          {onDelete && (
            <button
              className="btn-prop btn-prop--danger"
              onClick={() => onDelete(property._id)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyCard;
