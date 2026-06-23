import React from 'react';
import type { Tenant, TenantStatus } from '../../lib/tenantApi';
import './Shared.css';

const statusConfig: Record<TenantStatus, { label: string; cls: string }> = {
  active:               { label: 'Active',      cls: 'badge--active' },
  notice_period:        { label: 'Notice',       cls: 'badge--notice' },
  vacated:              { label: 'Vacated',      cls: 'badge--vacated' },
  pending_verification: { label: 'Pending',      cls: 'badge--pending' }
};

interface TenantTableProps {
  tenants: Tenant[];
  loading?: boolean;
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
  onView?: (tenant: Tenant) => void;
  showActions?: boolean;
}

const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  loading = false,
  onEdit,
  onDelete,
  onView,
  showActions = true
}) => {
  if (loading) {
    return (
      <div className="table-wrap">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="table-skeleton-row" />
        ))}
      </div>
    );
  }

  if (!tenants.length) {
    return (
      <div className="table-empty">
        <span className="table-empty__icon">🙋</span>
        <p>No tenants found</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="shared-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Property / Unit</th>
            <th>Lease Period</th>
            <th>Rent</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tenants.map(t => {
            const user = typeof t.userId === 'object' ? t.userId : null;
            const property = typeof t.propertyId === 'object' ? t.propertyId : null;
            const statusInfo = statusConfig[t.status] ?? statusConfig.active;
            const leaseEnd = new Date(t.leaseEnd);
            const isExpiring = leaseEnd > new Date() &&
              (leaseEnd.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

            return (
              <tr key={t._id} className={isExpiring ? 'row--warning' : ''}>
                <td>
                  <div className="tenant-cell">
                    <div className="tenant-avatar">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'T'}
                    </div>
                    <div>
                      <div className="tenant-name">{user?.name ?? '—'}</div>
                      <div className="tenant-email">{user?.email ?? '—'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="tenant-name">{property?.name ?? '—'}</div>
                  <div className="tenant-email">Unit {t.unitNumber}</div>
                </td>
                <td>
                  <div className="tenant-name">
                    {new Date(t.leaseStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className={`tenant-email ${isExpiring ? 'text--warning' : ''}`}>
                    → {leaseEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {isExpiring && ' ⚠️'}
                  </div>
                </td>
                <td>
                  <div className="tenant-name">₹{t.monthlyRent?.toLocaleString()}/mo</div>
                  <div className="tenant-email">Dep: ₹{t.depositPaid?.toLocaleString()}</div>
                </td>
                <td>
                  <span className={`shared-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                </td>
                {showActions && (
                  <td>
                    <div className="action-btns">
                      {onView && (
                        <button className="action-btn action-btn--view" onClick={() => onView(t)}>View</button>
                      )}
                      {onEdit && (
                        <button className="action-btn action-btn--edit" onClick={() => onEdit(t)}>Edit</button>
                      )}
                      {onDelete && (
                        <button className="action-btn action-btn--delete" onClick={() => onDelete(t)}>Remove</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TenantTable;
