import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, NOTIFICATION_ICONS } from '../../lib/notificationApi';
import type { AppNotification } from '../../lib/notificationApi';
import '../../components/Shared/Shared.css';
import '../Properties/Properties.css';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notif-page', unreadOnly, page],
    queryFn: () => notificationApi.list({ page, limit: 15, unreadOnly }),
    staleTime: 15_000
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-page'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notif-list'] });
    }
  });

  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-page'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notif-list'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-page'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    }
  });

  const purgeMutation = useMutation({
    mutationFn: notificationApi.purgeRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-page'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    }
  });

  const handleClick = (n: AppNotification) => {
    if (!n.read) markReadMutation.mutate(n._id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const notifications = data?.notifications ?? [];
  const meta = data?.meta;
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="properties-page">
      <div className="page-container">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">🔔 Notifications</h1>
            <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {unreadCount > 0 && (
              <button className="btn btn-primary" style={{ fontSize: '0.82rem' }}
                onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
                {markAllMutation.isPending ? 'Marking…' : '✓ Mark All Read'}
              </button>
            )}
            <button className="btn-prop btn-prop--secondary" style={{ fontSize: '0.82rem' }}
              onClick={() => purgeMutation.mutate()} disabled={purgeMutation.isPending}>
              {purgeMutation.isPending ? 'Clearing…' : '🗑️ Clear Read'}
            </button>
          </div>
        </div>

        {/* ── Filter ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {[false, true].map(v => (
            <button key={String(v)} onClick={() => { setUnreadOnly(v); setPage(1); }} style={{
              padding: '0.35rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.82rem', transition: 'all .15s',
              background: unreadOnly === v ? '#4f46e5' : 'transparent',
              color: unreadOnly === v ? '#fff' : '#94a3b8'
            }}>
              {v ? 'Unread' : 'All'}
            </button>
          ))}
        </div>

        {/* ── List ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="loading-grid">{[1,2,3,4,5].map(i => <div key={i} className="property-card-skeleton" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications</h3>
            <p>{unreadOnly ? 'No unread notifications.' : 'You have no notifications yet.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map(n => (
              <div key={n._id} style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                padding: '1rem 1.25rem',
                background: n.read ? 'var(--surface,#1e293b)' : 'rgba(79,70,229,0.08)',
                border: `1px solid ${n.read ? 'var(--border,#334155)' : 'rgba(79,70,229,0.25)'}`,
                borderRadius: 14, cursor: n.actionUrl ? 'pointer' : 'default',
                transition: 'box-shadow 0.15s, transform 0.15s'
              }}
              onClick={() => handleClick(n)}
              onMouseEnter={e => { if (n.actionUrl) { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: 2 }}>
                  {NOTIFICATION_ICONS[n.type] ?? '📩'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.92rem', color: '#f1f5f9' }}>{n.title}</span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                      {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5' }} />}
                      <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{n.body}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteMutation.mutate(n._id); }}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, padding: '0.1rem 0.3rem', borderRadius: 6 }}
                  title="Delete">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '1rem' }}>
            <button className="btn-prop btn-prop--secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="pagination__info">Page {meta.page} of {meta.totalPages}</span>
            <button className="btn-prop btn-prop--secondary" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
