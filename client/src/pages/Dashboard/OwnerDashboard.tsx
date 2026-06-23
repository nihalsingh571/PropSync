import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../../lib/propertyApi';
import { tenantApi } from '../../lib/tenantApi';
import { maintenanceApi } from '../../lib/maintenanceApi';
import { amenityApi } from '../../lib/amenityApi';
import '../Properties/Properties.css';
import '../../components/Shared/Shared.css';

const OwnerDashboard: React.FC = () => {
  const propQuery    = useQuery({ queryKey: ['owner-prop-stats'],  queryFn: () => propertyApi.list({ limit: 1 }), staleTime: 60_000 });
  const tenantQuery  = useQuery({ queryKey: ['tenant-stats'],      queryFn: () => tenantApi.stats(), staleTime: 60_000 });
  const maintQuery   = useQuery({ queryKey: ['maint-stats'],       queryFn: () => maintenanceApi.stats(), staleTime: 30_000 });
  const amenityQuery = useQuery({ queryKey: ['amenity-stats'],     queryFn: () => amenityApi.stats(), staleTime: 60_000 });
  const expiringQuery = useQuery({ queryKey: ['expiring-leases'],  queryFn: () => tenantApi.expiring(30), staleTime: 60_000 });
  const maintListQuery = useQuery({ queryKey: ['owner-maint-urgent'], queryFn: () => maintenanceApi.list({ priority: 'urgent', status: 'open', limit: 5 }), staleTime: 30_000 });

  const ts = tenantQuery.data;
  const ms = maintQuery.data;
  const as = amenityQuery.data;
  const totalProps = propQuery.data?.meta?.total ?? 0;
  const expiring = expiringQuery.data?.slice(0, 3) ?? [];
  const urgentMaint = maintListQuery.data?.requests ?? [];

  return (
    <div className="properties-page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏢 Owner Dashboard</h1>
            <p className="page-subtitle">Overview of your portfolio</p>
          </div>
          <Link to="/properties" className="btn btn-primary" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>
            + Add Property
          </Link>
        </div>

        {/* ── KPI Grid ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Properties',    value: totalProps,        icon: '🏢', color: '#818cf8' },
            { label: 'Active Tenants', value: ts?.active ?? 0,  icon: '🙋', color: '#10b981' },
            { label: 'Total Tenants',  value: ts?.total ?? 0,   icon: '📊', color: '#f59e0b' },
            { label: 'Open Requests',  value: ms?.open ?? 0,    icon: '🔧', color: '#ef4444' },
            { label: 'Urgent',         value: ms?.urgent ?? 0,  icon: '🚨', color: '#ef4444' },
            { label: 'Amenities',      value: as?.active ?? 0,  icon: '🏊', color: '#4f46e5' }
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--surface,#1e293b)', border: '1px solid var(--border,#334155)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>{k.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* ── Expiring Leases ───────────────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">⚠️ Expiring Leases</span>
              <Link to="/tenants" className="dash-card__link">View All →</Link>
            </div>
            {expiring.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.82rem' }}>No leases expiring soon.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {expiring.map((t: any) => {
                  const days = Math.ceil((new Date(t.leaseEnd).getTime() - Date.now()) / 86_400_000);
                  return (
                    <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{t.userId?.name ?? 'Tenant'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Unit {t.unitNumber}</div>
                      </div>
                      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem' }}>{days}d left</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Urgent Maintenance ────────────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">🚨 Urgent Maintenance</span>
              <Link to="/maintenance" className="dash-card__link">View All →</Link>
            </div>
            {urgentMaint.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.82rem' }}>No urgent requests. 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {urgentMaint.map((r: any) => (
                  <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{r.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Unit {r.unitNumber}</div>
                    </div>
                    <Link to={`/maintenance/${r._id}`} style={{ color: '#818cf8', fontSize: '0.72rem', textDecoration: 'none' }}>→</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Quick Actions ─────────────────────────────────────────── */}
          <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
            <div className="dash-card__header"><span className="dash-card__title">⚡ Quick Actions</span></div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { label: '🏢 My Properties',   to: '/properties' },
                { label: '🙋 Tenants',         to: '/tenants' },
                { label: '🔧 Maintenance',     to: '/maintenance' },
                { label: '🏊 Amenities',       to: '/amenities' },
                { label: '🔔 Notifications',   to: '/notifications' }
              ].map(l => (
                <Link key={l.to} to={l.to} style={{
                  padding: '0.6rem 1.1rem', background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)',
                  borderRadius: 10, textDecoration: 'none', color: '#818cf8', fontSize: '0.82rem', fontWeight: 600, transition: 'background 0.15s'
                }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`.dash-card{background:var(--surface,#1e293b);border:1px solid var(--border,#334155);border-radius:16px;padding:1.25rem;}.dash-card__header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;}.dash-card__title{font-size:.78rem;font-weight:700;color:#818cf8;text-transform:uppercase;letter-spacing:.04em;}.dash-card__link{font-size:.75rem;color:#64748b;text-decoration:none;}.dash-card__link:hover{color:#818cf8;}`}</style>
    </div>
  );
};

export default OwnerDashboard;
