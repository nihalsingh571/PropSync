import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, NOTIFICATION_ICONS } from '../../lib/notificationApi';
import type { AppNotification } from '../../lib/notificationApi';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const countQuery = useQuery({
    queryKey: ['notif-count'],
    queryFn: notificationApi.unreadCount,
    refetchInterval: 30_000,
    staleTime: 15_000
  });

  const listQuery = useQuery({
    queryKey: ['notif-list'],
    queryFn: () => notificationApi.list({ limit: 8 }),
    enabled: open,
    staleTime: 15_000
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notif-list'] });
    }
  });

  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      queryClient.invalidateQueries({ queryKey: ['notif-list'] });
    }
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif: AppNotification) => {
    if (!notif.read) markReadMutation.mutate(notif._id);
    if (notif.actionUrl) navigate(notif.actionUrl);
    setOpen(false);
  };

  const unread = countQuery.data?.unreadCount ?? 0;
  const notifications = listQuery.data?.notifications ?? [];

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* ── Bell Button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          position: 'relative', padding: '0.4rem', borderRadius: '8px',
          color: '#94a3b8', fontSize: '1.25rem', lineHeight: 1,
          transition: 'color 0.15s, background 0.15s'
        }}
        aria-label={`Notifications (${unread} unread)`}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#ef4444', color: '#fff',
            borderRadius: '999px', fontSize: '0.6rem', fontWeight: 800,
            minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: 340, maxHeight: 460, overflow: 'hidden',
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderBottom: '1px solid #334155' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f1f5f9' }}>
              Notifications {unread > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: '0.65rem', marginLeft: 4 }}>{unread}</span>}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unread > 0 && (
                <button onClick={() => markAllMutation.mutate()} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => { navigate('/notifications'); setOpen(false); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                See all →
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {listQuery.isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem',
                    borderBottom: '1px solid #1e293b',
                    cursor: n.actionUrl ? 'pointer' : 'default',
                    background: n.read ? 'transparent' : 'rgba(79,70,229,0.06)',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => { if (n.actionUrl) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(79,70,229,0.06)'; }}
                >
                  <div style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>
                    {NOTIFICATION_ICONS[n.type] ?? '📩'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <span style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.82rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f46e5', flexShrink: 0, marginTop: 3 }} />
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {n.body}
                    </p>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
