import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import Modal from '../../components/Admin/Modal';
import TenantTable from '../../components/Shared/TenantTable';
import { tenantApi } from '../../lib/tenantApi';
import type { Tenant, TenantStatus, CreateTenantPayload } from '../../lib/tenantApi';
import { propertyApi } from '../../lib/propertyApi';
import { useToast } from '../../contexts/ToastContext';
import '../../components/Shared/Shared.css';
import '../../pages/Properties/Properties.css';

const STATUS_OPTIONS: { value: TenantStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'notice_period', label: 'Notice Period' },
  { value: 'vacated', label: 'Vacated' },
  { value: 'pending_verification', label: 'Pending' }
];

const AdminTenants: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TenantStatus | ''>('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: ['admin-tenant-stats'],
    queryFn: tenantApi.stats,
    staleTime: 30_000
  });

  const expiringQuery = useQuery({
    queryKey: ['expiring-leases'],
    queryFn: () => tenantApi.expiring(30),
    staleTime: 60_000
  });

  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants', search, status, page],
    queryFn: () => tenantApi.list({ search, status, page, limit: 15 }),
    staleTime: 15_000
  });

  const propertiesQuery = useQuery({
    queryKey: ['properties-for-select'],
    queryFn: () => propertyApi.list({ limit: 200, status: 'active' }),
    staleTime: 60_000
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: CreateTenantPayload) => tenantApi.create(data),
    onSuccess: () => {
      showToast('Tenant added successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-stats'] });
      setShowCreateModal(false);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to create tenant', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) => tenantApi.update(id, data),
    onSuccess: () => {
      showToast('Tenant updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-stats'] });
      setEditingTenant(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantApi.delete(id),
    onSuccess: () => {
      showToast('Tenant record deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-stats'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Cannot delete', 'error')
  });

  const stats = statsQuery.data;
  const tenants = tenantsQuery.data?.tenants ?? [];
  const meta = tenantsQuery.data?.meta;
  const properties = propertiesQuery.data?.properties ?? [];

  return (
    <AdminLayout>
      <AdminHeader
        title="Tenant Management"
        onRefresh={() => {
          setLastRefresh(new Date());
          queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
          queryClient.invalidateQueries({ queryKey: ['admin-tenant-stats'] });
        }}
        isRefreshing={tenantsQuery.isFetching}
        lastUpdated={lastRefresh}
      />

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      {stats && (
        <div className="prop-stats-strip" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: stats.total, cls: '' },
            { label: 'Active', value: stats.active, cls: 'prop-stat-pill--green' },
            { label: 'Notice Period', value: stats.notice_period, cls: '' },
            { label: 'Pending', value: stats.pending, cls: '' },
            { label: 'Expiring (30d)', value: expiringQuery.data?.length ?? '…', cls: stats.notice_period > 0 ? 'prop-stat-pill--accent' : '' }
          ].map(s => (
            <div key={s.label} className={`prop-stat-pill ${s.cls}`}>
              <span className="prop-stat-pill__num">{s.value}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Expiring Leases Banner ───────────────────────────────────────── */}
      {(expiringQuery.data?.length ?? 0) > 0 && (
        <div className="expiring-banner">
          <span>⚠️ {expiringQuery.data!.length} lease(s) expiring within 30 days</span>
          <div className="expiring-names">
            {expiringQuery.data!.slice(0, 3).map(t => {
              const u = typeof t.userId === 'object' ? t.userId : null;
              const daysLeft = Math.ceil((new Date(t.leaseEnd).getTime() - Date.now()) / 86_400_000);
              return (
                <span key={t._id} className="expiring-chip">
                  {u?.name ?? 'Tenant'} · {daysLeft}d
                </span>
              );
            })}
            {expiringQuery.data!.length > 3 && <span className="expiring-chip">+{expiringQuery.data!.length - 3} more</span>}
          </div>
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="prop-filters" style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          onClick={() => setShowCreateModal(true)}>
          + Add Tenant
        </button>
        <input
          type="search"
          className="form-input prop-search"
          placeholder="Search by name, email, property or unit…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="form-input prop-filter-select" value={status}
          onChange={e => { setStatus(e.target.value as TenantStatus | ''); setPage(1); }}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <TenantTable
        tenants={tenants}
        loading={tenantsQuery.isLoading}
        onView={setViewingTenant}
        onEdit={setEditingTenant}
        onDelete={setDeleteTarget}
      />

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button className="btn-prop btn-prop--secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="pagination__info">Page {meta.page} of {meta.totalPages} ({meta.total} tenants)</span>
          <button className="btn-prop btn-prop--secondary" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── View Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(viewingTenant)} title="Tenant Details" onClose={() => setViewingTenant(null)}>
        {viewingTenant && <TenantDetailView tenant={viewingTenant} />}
      </Modal>

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={showCreateModal} title="Add Tenant" onClose={() => setShowCreateModal(false)}>
        <TenantForm
          properties={properties}
          onSubmit={data => createMutation.mutate(data as CreateTenantPayload)}
          submitting={createMutation.isPending}
        />
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(editingTenant)} title="Edit Tenant" onClose={() => setEditingTenant(null)}>
        {editingTenant && (
          <EditTenantForm
            tenant={editingTenant}
            onSubmit={data => updateMutation.mutate({ id: editingTenant._id, data })}
            submitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(deleteTarget)} title="Delete Tenant Record" onClose={() => setDeleteTarget(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: '#f1f5f9', lineHeight: 1.6 }}>
            ⚠️ This will permanently delete the tenant record for{' '}
            <strong>{typeof deleteTarget?.userId === 'object' ? deleteTarget.userId.name : 'this tenant'}</strong>.
            Only vacated tenants can be deleted.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn-prop btn-prop--secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-prop btn-prop--danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Record'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{bannerStyles}</style>
    </AdminLayout>
  );
};

// ── Inline Sub-components ──────────────────────────────────────────────────────

const TenantDetailView: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const u = typeof tenant.userId === 'object' ? tenant.userId : null;
  const p = typeof tenant.propertyId === 'object' ? tenant.propertyId : null;
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {[
        ['Tenant', u?.name ?? '—'],
        ['Email', u?.email ?? '—'],
        ['Phone', u?.phone ?? '—'],
        ['Property', p?.name ?? '—'],
        ['Unit', tenant.unitNumber],
        ['Lease Start', new Date(tenant.leaseStart).toLocaleDateString('en-IN')],
        ['Lease End', new Date(tenant.leaseEnd).toLocaleDateString('en-IN')],
        ['Monthly Rent', `₹${tenant.monthlyRent?.toLocaleString()}`],
        ['Deposit Paid', `₹${tenant.depositPaid?.toLocaleString()}`],
        ['Status', tenant.status],
        ['Emergency Contact', tenant.emergencyContact?.name ?? 'None'],
      ].map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{label}</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.875rem' }}>{value}</span>
        </div>
      ))}
      {tenant.notes && (
        <div style={{ background: '#1e293b', borderRadius: 8, padding: '0.75rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0 0 4px' }}>Notes</p>
          <p style={{ color: '#f1f5f9', fontSize: '0.875rem', margin: 0 }}>{tenant.notes}</p>
        </div>
      )}
    </div>
  );
};

const TenantForm: React.FC<{
  properties: any[];
  onSubmit: (data: any) => void;
  submitting: boolean;
}> = ({ properties, onSubmit, submitting }) => {
  const [form, setForm] = useState({
    userId: '', propertyId: '', unitNumber: '',
    leaseStart: '', leaseEnd: '', monthlyRent: 0, depositPaid: 0, rentDueDay: 1, notes: ''
  });

  const selectedProp = properties.find(p => p._id === form.propertyId);
  const availableUnits = selectedProp?.units?.filter((u: any) => u.status === 'vacant') ?? [];

  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="property-form">
      <div className="prop-form-grid">
        <div className="form-group form-group--full">
          <label className="form-label">User ID (from Users list) *</label>
          <input className="form-input" value={form.userId} onChange={e => set('userId', e.target.value)} placeholder="MongoDB ObjectId of the user" disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Property *</label>
          <select className="form-input" value={form.propertyId} onChange={e => set('propertyId', e.target.value)} disabled={submitting}>
            <option value="">Select Property</option>
            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Unit *</label>
          <select className="form-input" value={form.unitNumber} onChange={e => set('unitNumber', e.target.value)} disabled={submitting || !form.propertyId}>
            <option value="">Select Unit</option>
            {availableUnits.map((u: any) => (
              <option key={u._id} value={u.unitNumber}>{u.unitNumber} — ₹{u.monthlyRent?.toLocaleString()}/mo</option>
            ))}
          </select>
          {form.propertyId && availableUnits.length === 0 && (
            <small style={{ color: '#f87171' }}>No vacant units in this property</small>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Lease Start *</label>
          <input type="date" className="form-input" value={form.leaseStart} onChange={e => set('leaseStart', e.target.value)} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Lease End *</label>
          <input type="date" className="form-input" value={form.leaseEnd} onChange={e => set('leaseEnd', e.target.value)} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Monthly Rent (₹) *</label>
          <input type="number" className="form-input" value={form.monthlyRent} onChange={e => set('monthlyRent', Number(e.target.value))} min={0} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Deposit Paid (₹)</label>
          <input type="number" className="form-input" value={form.depositPaid} onChange={e => set('depositPaid', Number(e.target.value))} min={0} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Rent Due Day</label>
          <input type="number" className="form-input" value={form.rentDueDay} onChange={e => set('rentDueDay', Number(e.target.value))} min={1} max={28} disabled={submitting} />
        </div>
        <div className="form-group form-group--full">
          <label className="form-label">Notes</label>
          <textarea className="form-input form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} disabled={submitting} />
        </div>
      </div>
      <div className="prop-form-footer">
        <button type="button" className="btn btn-primary"
          disabled={submitting || !form.userId || !form.propertyId || !form.unitNumber || !form.leaseStart || !form.leaseEnd}
          onClick={() => onSubmit(form)}>
          {submitting ? <><span className="btn-spinner" />Creating…</> : 'Add Tenant'}
        </button>
      </div>
    </div>
  );
};

const EditTenantForm: React.FC<{
  tenant: Tenant;
  onSubmit: (data: Partial<Tenant>) => void;
  submitting: boolean;
}> = ({ tenant, onSubmit, submitting }) => {
  const [form, setForm] = useState({
    status: tenant.status,
    monthlyRent: tenant.monthlyRent,
    depositPaid: tenant.depositPaid,
    leaseEnd: tenant.leaseEnd?.split('T')[0] ?? '',
    notes: tenant.notes ?? '',
    emergencyContact: { ...tenant.emergencyContact }
  });

  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));
  const setEC = (k: string, v: string) => setForm(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [k]: v } }));

  return (
    <div className="property-form">
      <div className="prop-form-grid">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)} disabled={submitting}>
            <option value="active">Active</option>
            <option value="notice_period">Notice Period</option>
            <option value="vacated">Vacated</option>
            <option value="pending_verification">Pending Verification</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Monthly Rent (₹)</label>
          <input type="number" className="form-input" value={form.monthlyRent} onChange={e => set('monthlyRent', Number(e.target.value))} min={0} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Deposit Paid (₹)</label>
          <input type="number" className="form-input" value={form.depositPaid} onChange={e => set('depositPaid', Number(e.target.value))} min={0} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Lease End Date</label>
          <input type="date" className="form-input" value={form.leaseEnd} onChange={e => set('leaseEnd', e.target.value)} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Emergency Contact Name</label>
          <input className="form-input" value={form.emergencyContact.name ?? ''} onChange={e => setEC('name', e.target.value)} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Emergency Contact Phone</label>
          <input className="form-input" value={form.emergencyContact.phone ?? ''} onChange={e => setEC('phone', e.target.value)} disabled={submitting} />
        </div>
        <div className="form-group form-group--full">
          <label className="form-label">Notes</label>
          <textarea className="form-input form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} disabled={submitting} />
        </div>
      </div>
      <div className="prop-form-footer">
        <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => onSubmit(form)}>
          {submitting ? <><span className="btn-spinner" />Saving…</> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

const bannerStyles = `
.expiring-banner {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3);
  border-radius: 12px;
  padding: 0.9rem 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  color: #f59e0b;
  font-size: 0.875rem;
  font-weight: 600;
}
.expiring-names { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.expiring-chip {
  background: rgba(245,158,11,0.15);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  color: #f59e0b;
}
`;

export default AdminTenants;
