import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../../lib/propertyApi';
import type { Property, ListPropertiesParams } from '../../lib/propertyApi';
import PropertyCard from '../../components/Property/PropertyCard';
import Modal from '../../components/Admin/Modal';
import PropertyForm from '../../components/Property/PropertyForm';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './Properties.css';

const PROPERTY_STATS_QK = ['property-stats'];
const PROPERTIES_QK = ['properties'];

const Properties: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ListPropertiesParams>({ page: 1, limit: 12, search: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = user?.roles?.includes('admin');

  // ── Queries ────────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: PROPERTY_STATS_QK,
    queryFn: propertyApi.stats,
    staleTime: 30_000
  });

  const propertiesQuery = useQuery({
    queryKey: [...PROPERTIES_QK, filters],
    queryFn: () => propertyApi.list(filters),
    staleTime: 15_000
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({ data, files }: { data: Partial<Property>; files?: File[] }) => {
      const res = await propertyApi.create(data);
      if (files && files.length > 0) {
        await propertyApi.uploadImages(res.property._id, files);
      }
      return res;
    },
    onSuccess: () => {
      showToast('Property created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QK });
      queryClient.invalidateQueries({ queryKey: PROPERTY_STATS_QK });
      setShowCreateModal(false);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to create property', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertyApi.delete(id),
    onSuccess: () => {
      showToast('Property deleted', 'success');
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QK });
      queryClient.invalidateQueries({ queryKey: PROPERTY_STATS_QK });
      setDeleteId(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to delete property', 'error')
  });

  const stats = statsQuery.data;
  const { properties = [], meta } = propertiesQuery.data ?? {};

  return (
    <div className="properties-page">
      <div className="page-container">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">🏢 Properties</h1>
            <p className="page-subtitle">
              {isAdmin ? 'All properties on PropSync' : 'Your managed properties'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Add Property
          </button>
        </div>

        {/* ── Stats Strip ──────────────────────────────────────────────────── */}
        {stats && (
          <div className="prop-stats-strip">
            <div className="prop-stat-pill">
              <span className="prop-stat-pill__num">{stats.totalProperties}</span>
              <span>Properties</span>
            </div>
            <div className="prop-stat-pill">
              <span className="prop-stat-pill__num">{stats.totalUnits}</span>
              <span>Total Units</span>
            </div>
            <div className="prop-stat-pill prop-stat-pill--accent">
              <span className="prop-stat-pill__num">{stats.occupancyRate}%</span>
              <span>Occupancy</span>
            </div>
            <div className="prop-stat-pill">
              <span className="prop-stat-pill__num">{stats.vacantUnits}</span>
              <span>Vacant Units</span>
            </div>
            <div className="prop-stat-pill prop-stat-pill--green">
              <span className="prop-stat-pill__num">
                ₹{(stats.totalMonthlyRevenue / 1000).toFixed(0)}k
              </span>
              <span>Monthly Revenue</span>
            </div>
          </div>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="prop-filters">
          <input
            type="search"
            className="form-input prop-search"
            placeholder="Search by name or city..."
            value={filters.search ?? ''}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          />
          <select
            className="form-input prop-filter-select"
            value={filters.status ?? ''}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value as any, page: 1 }))}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="under_maintenance">Under Maintenance</option>
          </select>
          <select
            className="form-input prop-filter-select"
            value={filters.type ?? ''}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value as any, page: 1 }))}
          >
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
            <option value="co-living">Co-Living</option>
            <option value="independent_house">Independent House</option>
          </select>
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {propertiesQuery.isLoading ? (
          <div className="loading-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="property-card-skeleton" />)}
          </div>
        ) : propertiesQuery.isError ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Failed to load properties</h3>
            <p>Please try refreshing the page</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No properties found</h3>
            <p>{filters.search ? 'Try adjusting your search' : 'Add your first property to get started'}</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Add Property
            </button>
          </div>
        ) : (
          <>
            <div className="properties-grid">
              {properties.map(p => (
                <PropertyCard
                  key={p._id}
                  property={p}
                  onDelete={isAdmin ? setDeleteId : undefined}
                  showActions
                />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-prop btn-prop--secondary"
                  disabled={filters.page === 1}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  ← Previous
                </button>
                <span className="pagination__info">
                  Page {meta.page} of {meta.totalPages} ({meta.total} properties)
                </span>
                <button
                  className="btn-prop btn-prop--secondary"
                  disabled={filters.page === meta.totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        title="Add New Property"
        onClose={() => setShowCreateModal(false)}
      >
        <PropertyForm
          mode="create"
          onSubmit={(data, files) => createMutation.mutate({ data, files })}
          submitting={createMutation.isPending}
        />
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(deleteId)}
        title="Delete Property"
        onClose={() => setDeleteId(null)}
      >
        <div className="confirm-dialog">
          <p>⚠️ Are you sure you want to delete this property? This action cannot be undone.</p>
          <div className="confirm-dialog__actions">
            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Property'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Properties;
