import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../lib/tenantApi';
import { useAuth } from '../../contexts/AuthContext';
import '../../pages/Properties/Properties.css';
import '../../components/Shared/Shared.css';

const TenantProfile: React.FC = () => {
  useAuth(); // context kept for future role checks

  const { data: tenant, isLoading, isError } = useQuery({
    queryKey: ['my-tenant-profile'],
    queryFn: tenantApi.me,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="properties-page">
        <div className="page-container">
          <div className="empty-state"><div className="loading-spinner" /><p>Loading your profile…</p></div>
        </div>
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="properties-page">
        <div className="page-container">
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>No tenant profile found</h3>
            <p>You haven't been assigned to a property yet. Please contact your property manager.</p>
          </div>
        </div>
      </div>
    );
  }

  const property = typeof tenant.propertyId === 'object' ? tenant.propertyId : null;
  const leaseEnd = new Date(tenant.leaseEnd);
  const leaseStart = new Date(tenant.leaseStart);
  const today = new Date();
  const daysLeft = Math.ceil((leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = totalDays - daysLeft;
  const leaseProgress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  const statusLabels: Record<string, string> = {
    active: '✅ Active',
    notice_period: '⚠️ Notice Period',
    vacated: '🚪 Vacated',
    pending_verification: '🔵 Pending Verification'
  };

  return (
    <div className="properties-page">
      <div className="page-container">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">My Tenant Profile</h1>
            <p className="page-subtitle">Your lease and residency information</p>
          </div>
          <span className="shared-badge badge--active" style={{ fontSize: '0.875rem', padding: '0.4rem 1rem' }}>
            {statusLabels[tenant.status] ?? tenant.status}
          </span>
        </div>

        {/* ── Property Info ────────────────────────────────────────────── */}
        <div className="tenant-info-grid">

          {/* Property Card */}
          <div className="info-card">
            <h3 className="info-card__title">🏢 Property</h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-label">Property</span>
                <span className="info-value">{property?.name ?? '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Unit</span>
                <span className="info-value">{tenant.unitNumber}</span>
              </div>
              {property?.address && (
                <div className="info-row">
                  <span className="info-label">Address</span>
                  <span className="info-value">
                    {property.address.street}, {property.address.city}, {property.address.state}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lease Card */}
          <div className="info-card">
            <h3 className="info-card__title">📋 Lease Details</h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-label">Start</span>
                <span className="info-value">
                  {leaseStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">End</span>
                <span className={`info-value ${daysLeft <= 30 && daysLeft > 0 ? 'text-warning' : ''}`}>
                  {leaseEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {daysLeft > 0 && daysLeft <= 30 && ` ⚠️ ${daysLeft} days left`}
                  {daysLeft <= 0 && ' (Expired)'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Rent Due</span>
                <span className="info-value">Day {tenant.rentDueDay} of every month</span>
              </div>
            </div>

            {/* Lease Progress Bar */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
                <span>Lease Progress</span>
                <span>{leaseProgress}%</span>
              </div>
              <div className="occupancy-bar">
                <div
                  className="occupancy-bar__fill"
                  style={{
                    width: `${leaseProgress}%`,
                    background: daysLeft <= 30
                      ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                      : 'linear-gradient(90deg,#4f46e5,#7c3aed)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Financial Card */}
          <div className="info-card">
            <h3 className="info-card__title">💰 Financials</h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-label">Monthly Rent</span>
                <span className="info-value">₹{tenant.monthlyRent?.toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Deposit Paid</span>
                <span className="info-value">₹{tenant.depositPaid?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="info-card">
            <h3 className="info-card__title">🚨 Emergency Contact</h3>
            <div className="info-rows">
              {tenant.emergencyContact?.name ? (
                <>
                  <div className="info-row">
                    <span className="info-label">Name</span>
                    <span className="info-value">{tenant.emergencyContact.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{tenant.emergencyContact.phone ?? '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Relation</span>
                    <span className="info-value">{tenant.emergencyContact.relation ?? '—'}</span>
                  </div>
                </>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No emergency contact on file</p>
              )}
            </div>
          </div>

        </div>

        {/* ── Notes ────────────────────────────────────────────────────── */}
        {tenant.notes && (
          <div className="info-card" style={{ marginTop: '1.25rem' }}>
            <h3 className="info-card__title">📝 Notes</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{tenant.notes}</p>
          </div>
        )}

      </div>

      <style>{`
        .tenant-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }
        .info-card {
          background: var(--surface, #1e293b);
          border: 1px solid var(--border, #334155);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .info-card__title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #818cf8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border, #334155);
        }
        .info-rows { display: flex; flex-direction: column; gap: 0.6rem; }
        .info-row { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
        .info-label { font-size: 0.78rem; color: #94a3b8; white-space: nowrap; }
        .info-value { font-size: 0.875rem; font-weight: 600; color: #f1f5f9; text-align: right; }
        .text-warning { color: #f59e0b !important; }
        .occupancy-bar { height: 6px; background: #334155; border-radius: 999px; overflow: hidden; }
        .occupancy-bar__fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
      `}</style>
    </div>
  );
};

export default TenantProfile;
