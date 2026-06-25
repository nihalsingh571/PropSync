import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../../lib/propertyApi';
import type { Unit } from '../../lib/propertyApi';
import PropertyForm from '../../components/Property/PropertyForm';
import Modal from '../../components/Admin/Modal';
import ImageUploader from '../../components/Shared/ImageUploader';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../components/Property/Property.css';
import '../Properties/Properties.css';

const unitStatusColors: Record<string, string> = {
  vacant: 'status--vacant',
  occupied: 'status--occupied',
  maintenance: 'status--maintenance',
  reserved: 'status--open'
};

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnit, setNewUnit] = useState<Partial<Unit>>({
    unitNumber: '', bedrooms: 1, bathrooms: 1, monthlyRent: 0, depositAmount: 0, status: 'vacant'
  });

  const isAdmin = user?.roles?.includes('admin');
  const isOwner = user?.roles?.includes('property_owner');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.get(id!),
    enabled: Boolean(id)
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: any) => propertyApi.update(id!, data),
    onSuccess: () => {
      showToast('Property updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setShowEditModal(false);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed', 'error')
  });

  const addUnitMutation = useMutation({
    mutationFn: (data: Partial<Unit>) => propertyApi.addUnit(id!, data),
    onSuccess: () => {
      showToast('Unit added', 'success');
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setShowAddUnitModal(false);
      setNewUnit({ unitNumber: '', bedrooms: 1, bathrooms: 1, monthlyRent: 0, depositAmount: 0, status: 'vacant' });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to add unit', 'error')
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: Partial<Unit> }) =>
      propertyApi.updateUnit(id!, unitId, data),
    onSuccess: () => {
      showToast('Unit updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setEditingUnit(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed', 'error')
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: string) => propertyApi.deleteUnit(id!, unitId),
    onSuccess: () => {
      showToast('Unit removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Cannot delete unit', 'error')
  });

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => propertyApi.uploadImages(id!, files),
    onSuccess: () => {
      showToast('Images uploaded', 'success');
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Upload failed', 'error')
  });

  if (isLoading) return (
    <div className="properties-page">
      <div className="page-container">
        <div className="empty-state"><div className="loading-spinner" /><p>Loading property...</p></div>
      </div>
    </div>
  );

  const isTenant = user?.roles?.includes('tenant') && !isAdmin && !isOwner;
  const backLink = isTenant ? '/available-properties' : '/properties';

  if (isError || !property) return (
    <div className="properties-page">
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Property not found</h3>
          <Link to={backLink} className="btn btn-primary">← Back to Properties</Link>
        </div>
      </div>
    </div>
  );

  const ownerObj = typeof property.ownerId === 'object' ? property.ownerId : null;
  const canEdit = isAdmin || isOwner;

  return (
    <div className="properties-page">
      <div className="page-container">

        {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
        <div className="breadcrumb">
          <Link to={backLink} className="breadcrumb__link">Properties</Link>
          <span className="breadcrumb__sep">›</span>
          <span>{property.name}</span>
        </div>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{property.name}</h1>
            <p className="page-subtitle">
              📍 {property.address.street}, {property.address.city}, {property.address.state} — {property.type.replace(/_/g, ' ')}
            </p>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
                ✏️ Edit Property
              </button>
            </div>
          )}
        </div>

        {/* ── Stats Strip ─────────────────────────────────────────────────── */}
        <div className="prop-stats-strip" style={{ marginBottom: '2rem' }}>
          <div className="prop-stat-pill">
            <span className="prop-stat-pill__num">{property.totalUnits}</span>
            <span>Total Units</span>
          </div>
          <div className="prop-stat-pill prop-stat-pill--accent">
            <span className="prop-stat-pill__num">{property.occupancyRate}%</span>
            <span>Occupancy</span>
          </div>
          <div className="prop-stat-pill">
            <span className="prop-stat-pill__num">{property.occupiedUnits}</span>
            <span>Occupied</span>
          </div>
          <div className="prop-stat-pill">
            <span className="prop-stat-pill__num">{property.vacantUnits}</span>
            <span>Vacant</span>
          </div>
          {property.yearBuilt && (
            <div className="prop-stat-pill">
              <span className="prop-stat-pill__num">{property.yearBuilt}</span>
              <span>Year Built</span>
            </div>
          )}
        </div>

        {/* ── Cover Image ─────────────────────────────────────────────────── */}
        {property.coverImage && (
          <img src={property.coverImage} alt="Cover" className="cover-img" />
        )}

        {/* ── Description ─────────────────────────────────────────────────── */}
        {property.description && (
          <div className="detail-section">
            <h2 className="detail-section__title">About</h2>
            <p style={{ color: 'var(--text-muted, #94a3b8)', lineHeight: '1.7' }}>{property.description}</p>
          </div>
        )}

        {/* ── Owner Info ──────────────────────────────────────────────────── */}
        {ownerObj && (
          <div className="detail-section">
            <h2 className="detail-section__title">Property Owner</h2>
            <div className="owner-card">
              <div className="owner-avatar">{ownerObj.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className="owner-name">{ownerObj.name}</p>
                <p className="owner-contact">{ownerObj.email}</p>
                {ownerObj.phone && <p className="owner-contact">{ownerObj.phone}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Property Images ─────────────────────────────────────────────── */}
        <div className="detail-section">
          <h2 className="detail-section__title">Property Images</h2>
          
          {(property.images && property.images.length > 0) ? (
            <div className="img-gallery">
              {property.images.map((url, idx) => (
                <div key={idx} className="img-gallery__item" onClick={() => window.open(url, '_blank')}>
                  <img src={url} alt={`Property image ${idx + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '1rem' }}>No images available.</p>
          )}

          {canEdit && (
            <div style={{ marginTop: '1.5rem', maxWidth: '400px' }}>
              <ImageUploader
                maxFiles={5}
                onUpload={async (files) => { await uploadImagesMutation.mutateAsync(files); }}
                label="Add More Images"
                loading={uploadImagesMutation.isPending}
              />
            </div>
          )}
        </div>

        {/* ── Furnishing Details ────────────────────────────────────────────── */}
        {property.furnishings && property.furnishings.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section__title">Furnishing Details</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {property.furnishings.map(item => (
                <span key={item} style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Units Table ─────────────────────────────────────────────────── */}
        <div className="detail-section">
          <div className="detail-section__header">
            <h2 className="detail-section__title">Units ({property.units?.length ?? 0})</h2>
            {canEdit && (
              <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                onClick={() => setShowAddUnitModal(true)}>
                + Add Unit
              </button>
            )}
          </div>

          {property.units?.length === 0 ? (
            <p style={{ color: 'var(--text-muted, #94a3b8)' }}>No units added yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="units-table">
                <thead>
                  <tr>
                    <th>Unit #</th>
                    <th>Beds/Baths</th>
                    <th>Area</th>
                    <th>Rent / Deposit</th>
                    <th>Status</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {property.units.map(unit => (
                    <tr key={unit._id}>
                      <td><strong>{unit.unitNumber}</strong></td>
                      <td>{unit.bedrooms}B / {unit.bathrooms}Ba</td>
                      <td>{unit.area ? `${unit.area} sq ft` : '—'}</td>
                      <td>
                        ₹{unit.monthlyRent?.toLocaleString()}/mo
                        <br />
                        <small style={{ color: 'var(--text-muted, #94a3b8)' }}>
                          Dep: ₹{unit.depositAmount?.toLocaleString()}
                        </small>
                      </td>
                      <td>
                        <span className={`status-badge ${unitStatusColors[unit.status] || 'status--vacant'}`}>
                          {unit.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn-prop btn-prop--secondary" onClick={() => setEditingUnit(unit)}>
                              Edit
                            </button>
                            <button
                              className="btn-prop btn-prop--danger"
                              onClick={() => deleteUnitMutation.mutate(unit._id)}
                              disabled={deleteUnitMutation.isPending}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Property Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={showEditModal} title="Edit Property" onClose={() => setShowEditModal(false)}>
        <PropertyForm
          mode="edit"
          initialValues={property}
          onSubmit={data => updateMutation.mutate(data)}
          submitting={updateMutation.isPending}
        />
      </Modal>

      {/* ── Add Unit Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showAddUnitModal} title="Add Unit" onClose={() => setShowAddUnitModal(false)}>
        <UnitForm
          values={newUnit}
          onChange={setNewUnit}
          onSubmit={() => addUnitMutation.mutate(newUnit)}
          submitting={addUnitMutation.isPending}
        />
      </Modal>

      {/* ── Edit Unit Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(editingUnit)} title="Edit Unit" onClose={() => setEditingUnit(null)}>
        {editingUnit && (
          <UnitForm
            values={editingUnit}
            onChange={v => setEditingUnit(prev => ({ ...prev!, ...v }))}
            onSubmit={() => updateUnitMutation.mutate({ unitId: editingUnit._id, data: editingUnit })}
            submitting={updateUnitMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
};

// ── Inline Unit Form ──────────────────────────────────────────────────────────
const UnitForm: React.FC<{
  values: Partial<Unit>;
  onChange: (v: Partial<Unit>) => void;
  onSubmit: () => void;
  submitting: boolean;
}> = ({ values, onChange, onSubmit, submitting }) => {
  const set = (key: keyof Unit, val: unknown) => onChange({ ...values, [key]: val });

  return (
    <div className="property-form">
      <div className="prop-form-grid">
        <div className="form-group">
          <label className="form-label">Unit Number *</label>
          <input className="form-input" value={values.unitNumber ?? ''} onChange={e => set('unitNumber', e.target.value)} placeholder="e.g. A-101" disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Floor</label>
          <input type="number" className="form-input" value={values.floor ?? ''} onChange={e => set('floor', e.target.value ? Number(e.target.value) : null)} placeholder="0" disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Bedrooms</label>
          <input type="number" className="form-input" value={values.bedrooms ?? 1} onChange={e => set('bedrooms', Number(e.target.value))} min={0} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Bathrooms</label>
          <input type="number" className="form-input" value={values.bathrooms ?? 1} onChange={e => set('bathrooms', Number(e.target.value))} min={1} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Area (sq ft)</label>
          <input type="number" className="form-input" value={values.area ?? ''} onChange={e => set('area', e.target.value ? Number(e.target.value) : null)} placeholder="800" disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={values.status ?? 'vacant'} onChange={e => set('status', e.target.value)} disabled={submitting}>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Monthly Rent (₹)</label>
          <input type="number" className="form-input" value={values.monthlyRent ?? 0} onChange={e => set('monthlyRent', Number(e.target.value))} min={0} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Security Deposit (₹)</label>
          <input type="number" className="form-input" value={values.depositAmount ?? 0} onChange={e => set('depositAmount', Number(e.target.value))} min={0} disabled={submitting} />
        </div>
      </div>
      <div className="prop-form-footer">
        <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={submitting || !values.unitNumber?.trim()}>
          {submitting ? <><span className="btn-spinner" />Saving...</> : 'Save Unit'}
        </button>
      </div>
    </div>
  );
};

// ── Mini helper components ─────────────────────────────────────────────────────
const DetailSectionStyles = `
.detail-section {
  background: var(--surface, #1e293b);
  border: 1px solid var(--border, #334155);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
}
.detail-section__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary, #f1f5f9);
  margin: 0 0 1rem;
}
.detail-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.detail-section__header .detail-section__title { margin: 0; }
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--text-muted, #94a3b8);
}
.breadcrumb__link { color: #818cf8; text-decoration: none; }
.breadcrumb__link:hover { text-decoration: underline; }
.breadcrumb__sep { color: #475569; }
.owner-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.owner-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}
.owner-name { font-weight: 700; color: var(--text-primary, #f1f5f9); margin: 0; }
.owner-contact { font-size: 0.85rem; color: var(--text-muted, #94a3b8); margin: 0; }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const el = document.getElementById('property-detail-styles');
  if (!el) {
    const style = document.createElement('style');
    style.id = 'property-detail-styles';
    style.textContent = DetailSectionStyles;
    document.head.appendChild(style);
  }
}

export default PropertyDetail;
