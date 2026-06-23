import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import DataTable from '../../components/Admin/DataTable';
import Modal from '../../components/Admin/Modal';
import PropertyForm from '../../components/Property/PropertyForm';
import { propertyApi } from '../../lib/propertyApi';
import type { Property } from '../../lib/propertyApi';
import { useToast } from '../../contexts/ToastContext';
import '../../components/Property/Property.css';
import './AdminDashboard.css';

const AdminProperties: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const propertiesQuery = useQuery({
    queryKey: ['admin-properties', search, statusFilter],
    queryFn: () => propertyApi.list({ search, status: statusFilter as any, limit: 200 }),
    staleTime: 30_000
  });

  const statsQuery = useQuery({
    queryKey: ['admin-property-stats'],
    queryFn: propertyApi.stats,
    staleTime: 30_000
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: Partial<Property>) => propertyApi.create(data),
    onSuccess: () => {
      showToast('Property created', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-property-stats'] });
      setShowCreateModal(false);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to create', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Property> }) => propertyApi.update(id, data),
    onSuccess: () => {
      showToast('Property updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      setEditingProperty(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertyApi.delete(id),
    onSuccess: () => {
      showToast('Property deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-property-stats'] });
      setDeleteId(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to delete', 'error')
  });

  // ── Table Columns ──────────────────────────────────────────────────────────
  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: 'name',
      header: 'Property',
      cell: ({ row }) => (
        <div>
          <strong style={{ color: '#f1f5f9' }}>{row.original.name}</strong>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            {row.original.address.city}, {row.original.address.state}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <span style={{ textTransform: 'capitalize' }}>{row.original.type.replace(/_/g, ' ')}</span>
    },
    {
      accessorKey: 'ownerId',
      header: 'Owner',
      cell: ({ row }) => {
        const owner = row.original.ownerId;
        return typeof owner === 'object' ? owner.name : '—';
      }
    },
    {
      accessorKey: 'totalUnits',
      header: 'Units',
      cell: ({ row }) => (
        <span>
          {row.original.occupiedUnits}/{row.original.totalUnits}
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>
            ({row.original.occupancyRate}%)
          </span>
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const colors: Record<string, string> = {
          active: 'status--active',
          inactive: 'status--inactive',
          under_maintenance: 'status--maintenance'
        };
        return (
          <span className={`status-badge ${colors[row.original.status] ?? ''}`}>
            {row.original.status}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="admin-user-actions">
          <button onClick={() => setEditingProperty(row.original)}>Edit</button>
          <button
            style={{ color: '#f87171' }}
            onClick={() => setDeleteId(row.original._id)}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const stats = statsQuery.data;
  const properties = propertiesQuery.data?.properties ?? [];

  return (
    <AdminLayout>
      <AdminHeader
        title="Property Management"
        onRefresh={() => {
          setLastRefresh(new Date());
          queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
        }}
        isRefreshing={propertiesQuery.isFetching}
        lastUpdated={lastRefresh}
      />

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      {stats && (
        <div className="admin-dashboard-grid stats" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Properties', value: stats.totalProperties },
            { label: 'Total Units', value: stats.totalUnits },
            { label: 'Occupancy', value: `${stats.occupancyRate}%` },
            { label: 'Vacant Units', value: stats.vacantUnits },
            { label: 'Monthly Revenue', value: `₹${(stats.totalMonthlyRevenue / 1000).toFixed(0)}k` }
          ].map(stat => (
            <div key={stat.label} className="admin-stat-card">
              <div className="admin-stat-meta">
                <span className="admin-stat-label">{stat.label}</span>
              </div>
              <div className="admin-stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          style={{ fontSize: '0.85rem' }}
          onClick={() => setShowCreateModal(true)}
        >
          + Add Property
        </button>
        <input
          type="search"
          placeholder="Search by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="under_maintenance">Under Maintenance</option>
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <DataTable
        data={properties}
        columns={columns}
        loading={propertiesQuery.isLoading}
        emptyMessage="No properties found"
      />

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={showCreateModal} title="Add Property" onClose={() => setShowCreateModal(false)}>
        <PropertyForm
          mode="create"
          onSubmit={data => createMutation.mutate(data)}
          submitting={createMutation.isPending}
        />
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(editingProperty)} title="Edit Property" onClose={() => setEditingProperty(null)}>
        {editingProperty && (
          <PropertyForm
            mode="edit"
            initialValues={editingProperty}
            onSubmit={data => updateMutation.mutate({ id: editingProperty._id, data })}
            submitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(deleteId)} title="Delete Property" onClose={() => setDeleteId(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: '#f1f5f9' }}>
            ⚠️ Are you sure? This will permanently delete the property. Properties with active tenants cannot be deleted.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn-prop btn-prop--secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button
              className="btn-prop btn-prop--danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminProperties;
