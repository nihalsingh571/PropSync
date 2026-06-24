import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../lib/tenantApi';
import { maintenanceApi } from '../../lib/maintenanceApi';
import { amenityApi } from '../../lib/amenityApi';
import { notificationApi } from '../../lib/notificationApi';
import { NOTIFICATION_ICONS } from '../../lib/notificationApi';
import '../Properties/Properties.css';
import '../../components/Shared/Shared.css';

const TenantDashboard: React.FC = () => {
  const tenantQuery  = useQuery({ queryKey: ['my-tenant-profile'], queryFn: tenantApi.me, retry: false, staleTime: 60_000 });
  const maintQuery   = useQuery({ queryKey: ['maint-stats'],       queryFn: maintenanceApi.stats, staleTime: 30_000 });
  const bookingQuery = useQuery({ queryKey: ['my-amenity-bookings-dash'], queryFn: () => amenityApi.myBookings({ limit: 3, status: 'confirmed' }), staleTime: 30_000 });
  const notifQuery   = useQuery({ queryKey: ['notif-dash'], queryFn: () => notificationApi.list({ limit: 5 }), staleTime: 30_000 });

  const tenant   = tenantQuery.data;
  const maint    = maintQuery.data;
  const bookings = bookingQuery.data?.bookings ?? [];
  const notifs   = notifQuery.data?.notifications ?? [];
  const unread   = notifQuery.data?.unreadCount ?? 0;

  // Lease progress
  let leaseProgress = 0;
  let daysLeft = 0;
  if (tenant?.leaseStart && tenant?.leaseEnd) {
    const start = new Date(tenant.leaseStart).getTime();
    const end   = new Date(tenant.leaseEnd).getTime();
    const now   = Date.now();
    leaseProgress = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
    daysLeft = Math.ceil((end - now) / 86_400_000);
  }

  return (
    <div className="properties-page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">👋 My Dashboard</h1>
            <p className="page-subtitle">{tenant?.propertyId && typeof tenant.propertyId === 'object' ? `${(tenant.propertyId as any).name} · Unit ${tenant.unitNumber}` : 'Welcome back'}</p>
          </div>
          {unread > 0 && (
            <Link to="/notifications" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: 10, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
              🔔 {unread} unread
            </Link>
          )}
        </div>

        {/* ── KPI Strip ──────────────────────────────────────────────── */}
        <div className="prop-stats-strip" style={{ marginBottom: '1.5rem' }}>
          <div className="prop-stat-pill">
            <span className="prop-stat-pill__num">{maint?.open ?? '—'}</span>
            <span>Open Requests</span>
          </div>
          <div className="prop-stat-pill prop-stat-pill--accent">
            <span className="prop-stat-pill__num">{maint?.in_progress ?? '—'}</span>
            <span>In Progress</span>
          </div>
          <div className="prop-stat-pill prop-stat-pill--green">
            <span className="prop-stat-pill__num">{maint?.resolved ?? '—'}</span>
            <span>Resolved</span>
          </div>
          <div className="prop-stat-pill">
            <span className="prop-stat-pill__num">{bookings.length}</span>
            <span>Upcoming Bookings</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* ── Lease Progress ────────────────────────────────────────── */}
          <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
            <div className="dash-card__header">
              <span className="dash-card__title">📋 Lease Progress</span>
              <Link to="/my-lease" className="dash-card__link">View Details →</Link>
            </div>
            {tenant ? (
              <>
                <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>{new Date(tenant.leaseStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span style={{ color: daysLeft < 30 ? '#ef4444' : '#94a3b8', fontWeight: daysLeft < 30 ? 700 : 400 }}>
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                  </span>
                  <span>{new Date(tenant.leaseEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ height: 8, background: '#334155', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${leaseProgress}%`, background: daysLeft < 30 ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#4f46e5,#818cf8)', borderRadius: 999, transition: 'width 0.5s' }} />
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>{leaseProgress}% through lease</div>
              </>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No active lease found.</p>
            )}
          </div>

          {/* ── Upcoming Bookings ─────────────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">📅 Upcoming Bookings</span>
              <Link to="/amenities" className="dash-card__link">View All →</Link>
            </div>
            {bookings.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.82rem' }}>No upcoming bookings.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {bookings.map(b => {
                  const am = typeof b.amenityId === 'object' ? b.amenityId : null;
                  return (
                    <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(79,70,229,0.06)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{am?.name ?? 'Amenity'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(b.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                      </div>
                      <span className="shared-badge badge--active" style={{ fontSize: '0.65rem' }}>Confirmed</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Recent Notifications ──────────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">🔔 Notifications</span>
              <Link to="/notifications" className="dash-card__link">View All →</Link>
            </div>
            {notifs.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.82rem' }}>No notifications.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notifs.map(n => (
                  <div key={n._id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', opacity: n.read ? 0.6 : 1 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{NOTIFICATION_ICONS[n.type] ?? '📩'}</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: n.read ? 500 : 700, color: '#f1f5f9' }}>{n.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Quick Links ───────────────────────────────────────────── */}
          <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
            <div className="dash-card__header"><span className="dash-card__title">⚡ Quick Actions</span></div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { label: '🔧 New Maintenance Request', to: '/maintenance', state: { openNew: true } },
                { label: '🏊 Book Amenity',           to: '/amenities' },
                { label: '📋 My Lease',               to: '/my-lease' },
                { label: '🔔 Notifications',          to: '/notifications' }
              ].map(l => (
                <Link key={l.to} to={l.to} state={l.state} style={{
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

      <style>{dashStyles}</style>
    </div>
  );
};

const dashStyles = `
.dash-card { background: var(--surface,#1e293b); border: 1px solid var(--border,#334155); border-radius: 16px; padding: 1.25rem; }
.dash-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.dash-card__title { font-size: .78rem; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: .04em; }
.dash-card__link { font-size: .75rem; color: #64748b; text-decoration: none; transition: color .15s; }
.dash-card__link:hover { color: #818cf8; }
`;

export default TenantDashboard;
