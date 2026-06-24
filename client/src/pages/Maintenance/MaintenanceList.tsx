import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../../lib/maintenanceApi';
import type { MaintenanceStatus, MaintenancePriority, MaintenanceCategory, CreateMaintenancePayload, ListMaintenanceParams } from '../../lib/maintenanceApi';
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_LABELS } from '../../lib/maintenanceApi';
import MaintenanceCard from '../../components/Maintenance/MaintenanceCard';
import Modal from '../../components/Admin/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { propertyApi } from '../../lib/propertyApi';
import ImageUploader from '../../components/Shared/ImageUploader';
import '../../components/Maintenance/Maintenance.css';
import '../../components/Shared/Shared.css';
import '../Properties/Properties.css';

const MaintenanceList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isTenant = user?.roles?.includes('tenant');
  const isAdmin  = user?.roles?.includes('admin');
  const isOwner  = user?.roles?.includes('property_owner');

  const [filters, setFilters] = useState<ListMaintenanceParams>({ page: 1, limit: 12 });
  const [showNewModal, setShowNewModal] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const statsQuery = useQuery({ queryKey: ['maint-stats'], queryFn: maintenanceApi.stats, staleTime: 30_000 });
  const listQuery  = useQuery({ queryKey: ['maintenance', filters], queryFn: () => maintenanceApi.list(filters), staleTime: 15_000 });
  const propertiesQuery = useQuery({
    queryKey: ['properties-for-maint'],
    queryFn: () => propertyApi.list({ limit: 200 }),
    enabled: isTenant || isAdmin,
    staleTime: 60_000
  });

  // ── Create Mutation ────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({ data, files }: { data: CreateMaintenancePayload; files?: File[] }) => {
      const res = await maintenanceApi.create(data);
      if (files && files.length > 0) {
        await maintenanceApi.uploadAttachments(res.request._id, files);
      }
      return res;
    },
    onSuccess: (res) => {
      showToast('Request submitted!', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maint-stats'] });
      setShowNewModal(false);
      navigate(`/maintenance/${res.request._id}`);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to submit', 'error')
  });

  const stats = statsQuery.data;
  const { requests = [], meta } = listQuery.data ?? {};
  const properties = propertiesQuery.data?.properties ?? [];

  return (
    <div className="properties-page">
      <div className="page-container">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">🔧 Maintenance</h1>
            <p className="page-subtitle">
              {isTenant ? 'Your maintenance requests' : isOwner ? 'Requests for your properties' : 'All maintenance requests'}
            </p>
          </div>
          {isTenant && (
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>+ New Request</button>
          )}
        </div>

        {/* ── Stats Strip ──────────────────────────────────────────────── */}
        {stats && (
          <div className="prop-stats-strip">
            <div className="prop-stat-pill"><span className="prop-stat-pill__num">{stats.total}</span><span>Total</span></div>
            <div className="prop-stat-pill"><span className="prop-stat-pill__num">{stats.open}</span><span>Open</span></div>
            <div className="prop-stat-pill prop-stat-pill--accent"><span className="prop-stat-pill__num">{stats.in_progress}</span><span>In Progress</span></div>
            <div className="prop-stat-pill prop-stat-pill--green"><span className="prop-stat-pill__num">{stats.resolved}</span><span>Resolved</span></div>
            {(stats.urgent > 0) && (
              <div className="prop-stat-pill" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
                <span className="prop-stat-pill__num" style={{ color: '#ef4444' }}>{stats.urgent}</span>
                <span>Urgent</span>
              </div>
            )}
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="prop-filters">
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

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        {listQuery.isLoading ? (
          <div className="loading-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="property-card-skeleton" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔧</div>
            <h3>No requests found</h3>
            <p>{isTenant ? 'Submit your first maintenance request.' : 'No requests match your filters.'}</p>
            {isTenant && <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>+ New Request</button>}
          </div>
        ) : (
          <>
            <div className="maintenance-grid">
              {requests.map(r => (
                <MaintenanceCard
                  key={r._id}
                  request={r}
                  onClick={() => navigate(`/maintenance/${r._id}`)}
                />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="pagination">
                <button className="btn-prop btn-prop--secondary" disabled={filters.page === 1}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}>← Prev</button>
                <span className="pagination__info">Page {meta.page} of {meta.totalPages} ({meta.total} requests)</span>
                <button className="btn-prop btn-prop--secondary" disabled={filters.page === meta.totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── New Request Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showNewModal} title="New Maintenance Request" onClose={() => setShowNewModal(false)}>
        <NewRequestForm
          properties={properties}
          onSubmit={(data, files) => createMutation.mutate({ data, files })}
          submitting={createMutation.isPending}
        />
      </Modal>
    </div>
  );
};

// ── New Request Form ──────────────────────────────────────────────────────────
const NewRequestForm: React.FC<{
  properties: any[];
  onSubmit: (data: CreateMaintenancePayload, files?: File[]) => void;
  submitting: boolean;
}> = ({ properties, onSubmit, submitting }) => {
  const [form, setForm] = useState<CreateMaintenancePayload>({
    propertyId: '', unitNumber: '', title: '', description: '',
    category: 'other', priority: 'medium'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const selectedProp = properties.find(p => p._id === form.propertyId);
  const myUnits = selectedProp?.units ?? [];

  const set = (k: keyof CreateMaintenancePayload, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="property-form">
      <div className="prop-form-grid">
        {properties.length > 0 && (
          <div className="form-group">
            <label className="form-label">Property</label>
            <select className="form-input" value={form.propertyId} onChange={e => set('propertyId', e.target.value)} disabled={submitting}>
              <option value="">Select Property</option>
              {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Unit Number *</label>
          {myUnits.length > 0 ? (
            <select className="form-input" value={form.unitNumber} onChange={e => set('unitNumber', e.target.value)} disabled={submitting}>
              <option value="">Select Unit</option>
              {myUnits.map((u: any) => <option key={u._id} value={u.unitNumber}>{u.unitNumber}</option>)}
            </select>
          ) : (
            <input className="form-input" value={form.unitNumber} onChange={e => set('unitNumber', e.target.value)} placeholder="e.g. A-101" disabled={submitting} />
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select className="form-input" value={form.category} onChange={e => set('category', e.target.value as MaintenanceCategory)} disabled={submitting}>
            {(Object.entries(CATEGORY_LABELS) as [MaintenanceCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value as MaintenancePriority)} disabled={submitting}>
            {(Object.keys(PRIORITY_CONFIG) as MaintenancePriority[]).map(p => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
            ))}
          </select>
        </div>
        <div className="form-group form-group--full">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief summary of the issue" disabled={submitting} maxLength={120} />
        </div>
        <div className="form-group form-group--full">
          <label className="form-label">Description *</label>
          <textarea className="form-input form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the issue in detail…" rows={4} disabled={submitting} />
        </div>
        <div className="form-group form-group--full">
          <label className="form-label">Photos / Attachments</label>
          <ImageUploader
            maxFiles={5}
            onUpload={async (files) => setSelectedFiles(files)}
            label="Select Photos"
            hint="JPG, PNG, WebP up to 5MB. They will be uploaded when you submit."
            loading={submitting}
          />
        </div>
      </div>
      <div className="prop-form-footer">
        <button type="button" className="btn btn-primary"
          disabled={submitting || !form.title.trim() || !form.description.trim() || !form.unitNumber.trim()}
          onClick={() => onSubmit(form, selectedFiles)}>
          {submitting ? <><span className="btn-spinner" />Submitting…</> : 'Submit Request'}
        </button>
      </div>
    </div>
  );
};

export default MaintenanceList;
