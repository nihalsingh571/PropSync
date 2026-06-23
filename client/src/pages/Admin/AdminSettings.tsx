import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import ActivityMonitor from '../../components/Admin/ActivityMonitor';
import { adminApi, type SystemHealthResponse } from '../../lib/adminApi';
import { useAdminRealtime } from '../../contexts/AdminRealtimeContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

const prettyEventName = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const formatSeconds = (seconds: number) => {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { events } = useAdminRealtime();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [lastManualRefresh, setLastManualRefresh] = React.useState<Date | null>(null);

  const canViewSystemHealth = user?.roles?.includes('admin');

  const systemHealthQuery = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: adminApi.getSystemHealth,
    retry: false,
    enabled: canViewSystemHealth
  });

  const backupMutation = useMutation({
    mutationFn: () => adminApi.triggerBackup(),
    onSuccess: (data) => {
      showToast(`Backup queued (${data.jobId})`, 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to queue backup';
      showToast(message, 'error');
    }
  });

  const canTriggerBackup = canViewSystemHealth;
  const latestEvent = events[0];

  const handleManualRefresh = () => {
    if (!canViewSystemHealth) return;
    setLastManualRefresh(new Date());
    queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
  };

  const health = systemHealthQuery.data as SystemHealthResponse | undefined;

  return (
    <AdminLayout>
      <AdminHeader
        title="Admin Settings & Health"
        onRefresh={handleManualRefresh}
        isRefreshing={canViewSystemHealth ? systemHealthQuery.isFetching : false}
        lastUpdated={lastManualRefresh}
      />
      {latestEvent && (
        <div className="admin-banner">
          <strong>Live update:</strong> {prettyEventName(latestEvent.event)}
          <span>{new Date(latestEvent.timestamp).toLocaleTimeString()}</span>
        </div>
      )}
      <div className="admin-panels">
        <div className="admin-panel">
          <h3>System Health</h3>
          {!canViewSystemHealth && (
            <p className="muted">Only super admins can view detailed system health.</p>
          )}
          {canViewSystemHealth && systemHealthQuery.isLoading && <p>Loading health metrics...</p>}
          {canViewSystemHealth && systemHealthQuery.isError && (
            <p className="error">
              {systemHealthQuery.error instanceof Error
                ? systemHealthQuery.error.message
                : 'Unable to fetch health metrics.'}
            </p>
          )}
          {canViewSystemHealth && health && (
            <div className="admin-dashboard-grid stats">
              <div className="admin-stat-card">
                <div className="admin-stat-meta">
                  <span className="admin-stat-label">Uptime</span>
                </div>
                <div className="admin-stat-value">{formatSeconds(health.uptime)}</div>
                <p className="admin-stat-description">
                  Last checked {new Date(health.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-meta">
                  <span className="admin-stat-label">Database</span>
                </div>
                <div className="admin-stat-value">{health.dbStatus}</div>
                <p className="admin-stat-description">Mongo connection</p>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-meta">
                  <span className="admin-stat-label">Memory</span>
                </div>
                <div className="admin-stat-value">
                  {Math.round((health.memoryUsage?.rss || 0) / (1024 * 1024))} MB
                </div>
                <p className="admin-stat-description">RSS usage</p>
              </div>
            </div>
          )}
        </div>

        <div className="admin-panel">
          <h3>System Actions</h3>
          <div className="admin-settings-actions">
            <button
              onClick={() => backupMutation.mutate()}
              disabled={!canTriggerBackup || backupMutation.isPending}
            >
              {backupMutation.isPending ? 'Queuing Backup…' : 'Trigger Backup'}
            </button>
            {!canTriggerBackup && (
              <p className="muted">Only super admins can trigger backups.</p>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <h3>Realtime Activity</h3>
          <ActivityMonitor events={events} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
