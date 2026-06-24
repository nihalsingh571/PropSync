import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { maintenanceApi } from '../../lib/maintenanceApi';
import { STATUS_CONFIG } from '../../lib/maintenanceApi';
import { notificationApi, NOTIFICATION_ICONS } from '../../lib/notificationApi';
import '../Properties/Properties.css';
import '../../components/Shared/Shared.css';

const StaffDashboard: React.FC = () => {
  const statsQuery = useQuery({ queryKey: ['staff-maint-stats'], queryFn: maintenanceApi.stats, staleTime: 30_000 });
  const assignedQuery = useQuery({
    queryKey: ['staff-assigned'],
    queryFn: () => maintenanceApi.list({ status: 'assigned', limit: 5 }),
    staleTime: 30_000
  });
  const inProgressQuery = useQuery({
    queryKey: ['staff-in-progress'],
    queryFn: () => maintenanceApi.list({ status: 'in_progress', limit: 5 }),
    staleTime: 30_000
  });
  const notifQuery = useQuery({ 
    queryKey: ['notif-dash'], 
    queryFn: () => notificationApi.list({ limit: 5 }), 
    staleTime: 30_000 
  });

  const s = statsQuery.data;
  const assigned   = assignedQuery.data?.requests ?? [];
  const inProgress = inProgressQuery.data?.requests ?? [];
  const notifs   = notifQuery.data?.notifications ?? [];
  const unread   = notifQuery.data?.unreadCount ?? 0;

  return (
    <div className="properties-page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">👷 Staff Dashboard</h1>
            <p className="page-subtitle">Your maintenance workload</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {unread > 0 && (
              <Link to="/notifications" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: 10, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                🔔 {unread} unread
              </Link>
            )}
            <Link to="/maintenance" className="btn btn-primary" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>
              View All Requests
            </Link>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="prop-stats-strip" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Assigned',   value: s?.assigned ?? 0,    color: '#f59e0b' },
            { label: 'In Progress', value: s?.in_progress ?? 0, color: '#4f46e5' },
            { label: 'Pending Review', value: s?.pending_review ?? 0, color: '#94a3b8' },
            { label: 'Resolved',   value: s?.resolved ?? 0,    color: '#10b981' }
          ].map(k => (
            <div key={k.label} className="prop-stat-pill">
              <span className="prop-stat-pill__num" style={{ color: k.color }}>{k.value}</span>
              <span>{k.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* ── Assigned to Me ────────────────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">📋 Assigned To Me</span>
              <Link to="/maintenance" className="dash-card__link">View All →</Link>
            </div>
            {assigned.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.82rem' }}>No assigned requests.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {assigned.map((r: any) => (
                  <Link key={r._id} to={`/maintenance/${r._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{r.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Unit {r.unitNumber}</div>
                      </div>
                      <span className={`shared-badge ${STATUS_CONFIG['assigned'].cls}`} style={{ fontSize: '0.65rem' }}>Assigned</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── In Progress ───────────────────────────────────────────── */}
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">⚙️ In Progress</span>
              <Link to="/maintenance" className="dash-card__link">View All →</Link>
            </div>
            {inProgress.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Nothing in progress.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {inProgress.map((r: any) => (
                  <Link key={r._id} to={`/maintenance/${r._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{r.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Unit {r.unitNumber}</div>
                      </div>
                      <span className={`shared-badge ${STATUS_CONFIG['in_progress'].cls}`} style={{ fontSize: '0.65rem' }}>In Progress</span>
                    </div>
                  </Link>
                ))}
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

          {/* ── Quick Actions ─────────────────────────────────────────── */}
          <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
            <div className="dash-card__header"><span className="dash-card__title">⚡ Quick Actions</span></div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { label: '🔧 My Requests',     to: '/maintenance' },
                { label: '📋 Assigned',         to: '/maintenance?status=assigned' },
                { label: '🔔 Notifications',    to: '/notifications' }
              ].map(l => (
                <Link key={l.to} to={l.to} style={{
                  padding: '0.6rem 1.1rem', background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)',
                  borderRadius: 10, textDecoration: 'none', color: '#818cf8', fontSize: '0.82rem', fontWeight: 600
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

export default StaffDashboard;
