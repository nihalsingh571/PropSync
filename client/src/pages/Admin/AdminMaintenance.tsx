import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import Modal from '../../components/Admin/Modal';
import { maintenanceApi } from '../../lib/maintenanceApi';
import type { MaintenanceStatus, MaintenancePriority, MaintenanceCategory, ListMaintenanceParams } from '../../lib/maintenanceApi';
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_LABELS } from '../../lib/maintenanceApi';
import MaintenanceCard from '../../components/Maintenance/MaintenanceCard';
import { useToast } from '../../contexts/ToastContext';
import '../../components/Maintenance/Maintenance.css';
import '../../components/Shared/Shared.css';
import '../../pages/Properties/Properties.css';

const AdminMaintenance: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ListMaintenanceParams>({ page: 1, limit: 15 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const statsQuery = useQuery({ queryKey: ['admin-maint-stats'], queryFn: maintenanceApi.stats, staleTime: 30_000 });
  const listQuery  = useQuery({ queryKey: ['admin-maintenance', filters], queryFn: () => maintenanceApi.list(filters), staleTime: 15_000 });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.delete(id),
    onSuccess: () => {
      showToast('Request deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['admin-maint-stats'] });
      setDeletingId(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Delete failed', 'error')
  });

  const stats = statsQuery.data;
  const { requests = [], meta } = listQuery.data ?? {};

  return (
    <AdminLayout>
      <AdminHeader
        title="Maintenance Management"
        onRefresh={() => {
          setLastRefresh(new Date());
          queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
          queryClient.invalidateQueries({ queryKey: ['admin-maint-stats'] });
        }}
        isRefreshing={listQuery.isFetching}
        lastUpdated={lastRefresh}
      />

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      {stats && (
        <div className="prop-stats-strip" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total',       value: stats.total,       cls: '' },
            { label: 'Open',        value: stats.open,        cls: '' },
            { label: 'In Progress', value: stats.in_progress, cls: 'prop-stat-pill--accent' },
            { label: 'Pending',     value: stats.pending_review, cls: '' },
            { label: 'Resolved',    value: stats.resolved,    cls: 'prop-stat-pill--green' },
            { label: 'Urgent',      value: stats.urgent,      cls: stats.urgent > 0 ? 'prop-stat-pill--danger' : '' }
          ].map(s => (
            <div key={s.label} className={`prop-stat-pill ${s.cls}`}>
              <span className="prop-stat-pill__num">{s.value}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Urgent Banner ────────────────────────────────────────────────── */}
      {(stats?.urgent ?? 0) > 0 && (
        <div className="expiring-banner" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
          <span>🚨 {stats!.urgent} urgent request(s) require immediate attention</span>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="prop-filters" style={{ marginBottom: '1rem' }}>
        <input type="search" className="form-input prop-search" placeholder="Search requests…"
          value={filters.search ?? ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
        <select className="form-input prop-filter-select" value={filters.status ?? ''}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value as MaintenanceStatus | '', page: 1 }))}>
          <option value="">All Status</option>
          {(Object.keys(STATUS_CONFIG) as MaintenanceStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <select className="form-input prop-filter-select" value={filters.priority ?? ''}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value as MaintenancePriority | '', page: 1 }))}>
          <option value="">All Priority</option>
          {(Object.keys(PRIORITY_CONFIG) as MaintenancePriority[]).map(p => (
            <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
          ))}
        </select>
        <select className="form-input prop-filter-select" value={filters.category ?? ''}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value as MaintenanceCategory | '', page: 1 }))}>
          <option value="">All Categories</option>
          {(Object.keys(CATEGORY_LABELS) as MaintenanceCategory[]).map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* ── Cards Grid ───────────────────────────────────────────────────── */}
      {listQuery.isLoading ? (
        <div className="loading-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="property-card-skeleton" />)}
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem' }}>🔧</div>
          <p>No maintenance requests match your filters.</p>
        </div>
      ) : (
        <div className="maintenance-grid">
          {requests.map(r => (
            <div key={r._id} style={{ position: 'relative' }}>
              <MaintenanceCard
                request={r}
                onClick={() => navigate(`/maintenance/${r._id}`)}
              />
              <button
                className="action-btn action-btn--delete"
                style={{ position: 'absolute', top: 8, right: 8, padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                onClick={e => { e.stopPropagation(); setDeletingId(r._id); }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button className="btn-prop btn-prop--secondary" disabled={(filters.page ?? 1) <= 1}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}>← Prev</button>
          <span className="pagination__info">Page {meta.page} of {meta.totalPages} ({meta.total} requests)</span>
          <button className="btn-prop btn-prop--secondary" disabled={filters.page === meta.totalPages}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next →</button>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(deletingId)} title="Delete Request" onClose={() => setDeletingId(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: '#f1f5f9', lineHeight: 1.6 }}>
            ⚠️ This will permanently delete this maintenance request and all its history. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn-prop btn-prop--secondary" onClick={() => setDeletingId(null)}>Cancel</button>
            <button className="btn-prop btn-prop--danger"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Request'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`.prop-stat-pill--danger { border-color: rgba(239,68,68,0.3); }
        .prop-stat-pill--danger .prop-stat-pill__num { color: #ef4444; }
        .expiring-banner { background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.3); border-radius: 12px; padding: .9rem 1.25rem; margin-bottom: 1rem; display:flex; align-items:center; gap:1rem; flex-wrap:wrap; font-size:.875rem; font-weight:600; }`}</style>
    </AdminLayout>
  );
};

export default AdminMaintenance;
