import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { amenityApi } from '../../lib/amenityApi';
import type { Amenity, AmenityType, AmenityStatus, AmenityBooking } from '../../lib/amenityApi';
import { AMENITY_TYPE_CONFIG, BOOKING_STATUS_CONFIG } from '../../lib/amenityApi';
import { propertyApi } from '../../lib/propertyApi';
import Modal from '../../components/Admin/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../components/Shared/Shared.css';
import '../Properties/Properties.css';

// ── Amenity Card ───────────────────────────────────────────────────────────────
const AmenityCard: React.FC<{
  amenity: Amenity;
  onBook?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
}> = ({ amenity, onBook, onEdit, onDelete, canManage }) => {
  const property = typeof amenity.propertyId === 'object' ? amenity.propertyId : null;
  const cfg = AMENITY_TYPE_CONFIG[amenity.type];
  const statusColor = amenity.status === 'active' ? '#10b981' : amenity.status === 'inactive' ? '#94a3b8' : '#f59e0b';

  return (
    <div className="amenity-card">
      <div className="amenity-card__icon">{cfg.icon}</div>
      <div className="amenity-card__content">
        <div className="amenity-card__header">
          <h3 className="amenity-card__name">{amenity.name}</h3>
          <span className="amenity-card__status" style={{ color: statusColor }}>●</span>
        </div>
        <div className="amenity-card__type">{cfg.label}</div>
        {property && <div className="amenity-card__property">🏢 {property.name}</div>}
        <div className="amenity-card__meta">
          <span>👥 Cap: {amenity.capacity}</span>
          <span>⏱️ {amenity.bookingDurationMin}–{amenity.bookingDurationMax}m</span>
          {amenity.requiresApproval && <span className="badge--notice shared-badge" style={{ fontSize: '0.65rem' }}>Approval req.</span>}
        </div>
        {amenity.rules.length > 0 && (
          <div className="amenity-card__rules">
            {amenity.rules.slice(0, 2).map((r, i) => <span key={i} className="rule-chip">📌 {r}</span>)}
          </div>
        )}
        <div className="amenity-card__actions">
          {onBook && amenity.status === 'active' && (
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }} onClick={onBook}>
              Book Now
            </button>
          )}
          {canManage && (
            <>
              <button className="action-btn action-btn--edit" onClick={onEdit}>Edit</button>
              <button className="action-btn action-btn--delete" onClick={onDelete}>Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Amenities Page ────────────────────────────────────────────────────────
const Amenities: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isTenant = user?.roles?.includes('tenant');
  const isAdmin  = user?.roles?.includes('admin');
  const isOwner  = user?.roles?.includes('property_owner');
  const canManage = isAdmin || isOwner;

  const [statusFilter, setStatusFilter] = useState<AmenityStatus | ''>('active');
  const [typeFilter, setTypeFilter] = useState<AmenityType | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Amenity | null>(null);
  const [bookingTarget, setBookingTarget] = useState<Amenity | null>(null);
  const [showMyBookings, setShowMyBookings] = useState(false);

  const listQuery = useQuery({
    queryKey: ['amenities', statusFilter, typeFilter],
    queryFn: () => amenityApi.list({ status: statusFilter || undefined, type: typeFilter || undefined, limit: 50 }),
    staleTime: 30_000
  });

  const myBookingsQuery = useQuery({
    queryKey: ['my-amenity-bookings'],
    queryFn: () => amenityApi.myBookings({ limit: 20 }),
    enabled: isTenant && showMyBookings,
    staleTime: 30_000
  });

  const propertiesQuery = useQuery({
    queryKey: ['properties-for-amenity'],
    queryFn: () => propertyApi.list({ limit: 100 }),
    enabled: canManage,
    staleTime: 60_000
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Amenity>) => amenityApi.create(data),
    onSuccess: () => {
      showToast('Amenity created!', 'success');
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      setShowCreateModal(false);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Amenity> }) => amenityApi.update(id, data),
    onSuccess: () => {
      showToast('Amenity updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      setEditingAmenity(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => amenityApi.delete(id),
    onSuccess: () => {
      showToast('Amenity deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed', 'error')
  });

  const bookMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => amenityApi.book(id, data),
    onSuccess: () => {
      showToast('Booking created!', 'success');
      queryClient.invalidateQueries({ queryKey: ['my-amenity-bookings'] });
      setBookingTarget(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Booking failed', 'error')
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => amenityApi.cancel(bookingId, 'Cancelled by tenant'),
    onSuccess: () => {
      showToast('Booking cancelled', 'success');
      queryClient.invalidateQueries({ queryKey: ['my-amenity-bookings'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed', 'error')
  });

  const amenities = listQuery.data?.amenities ?? [];
  const properties = propertiesQuery.data?.properties ?? [];

  return (
    <div className="properties-page">
      <div className="page-container">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">🏊 Amenities</h1>
            <p className="page-subtitle">{isTenant ? 'Book facilities in your building' : 'Manage property amenities'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {isTenant && (
              <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }}
                onClick={() => setShowMyBookings(!showMyBookings)}>
                {showMyBookings ? '← Amenities' : '📅 My Bookings'}
              </button>
            )}
            {canManage && (
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Add Amenity</button>
            )}
          </div>
        </div>

        {/* ── My Bookings View ─────────────────────────────────────────── */}
        {showMyBookings && isTenant ? (
          <MyBookingsView
            bookings={myBookingsQuery.data?.bookings ?? []}
            loading={myBookingsQuery.isLoading}
            onCancel={id => cancelMutation.mutate(id)}
            cancelling={cancelMutation.isPending}
          />
        ) : (
          <>
            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="prop-filters">
              <select className="form-input prop-filter-select" value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as AmenityStatus | '')}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_maintenance">Under Maintenance</option>
              </select>
              <select className="form-input prop-filter-select" value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as AmenityType | '')}>
                <option value="">All Types</option>
                {(Object.keys(AMENITY_TYPE_CONFIG) as AmenityType[]).map(t => (
                  <option key={t} value={t}>{AMENITY_TYPE_CONFIG[t].icon} {AMENITY_TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>

            {/* ── Grid ─────────────────────────────────────────────────── */}
            {listQuery.isLoading ? (
              <div className="loading-grid">{[1,2,3,4].map(i => <div key={i} className="property-card-skeleton" />)}</div>
            ) : amenities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏊</div>
                <h3>No amenities found</h3>
                {canManage && <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Add First Amenity</button>}
              </div>
            ) : (
              <div className="amenity-grid">
                {amenities.map(a => (
                  <AmenityCard
                    key={a._id}
                    amenity={a}
                    canManage={canManage}
                    onBook={() => setBookingTarget(a)}
                    onEdit={() => setEditingAmenity(a)}
                    onDelete={() => setDeleteTarget(a)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <Modal isOpen={showCreateModal} title="Add Amenity" onClose={() => setShowCreateModal(false)}>
        <AmenityForm
          properties={properties}
          onSubmit={data => createMutation.mutate(data)}
          submitting={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(editingAmenity)} title="Edit Amenity" onClose={() => setEditingAmenity(null)}>
        {editingAmenity && (
          <AmenityForm
            initial={editingAmenity}
            properties={properties}
            onSubmit={data => updateMutation.mutate({ id: editingAmenity._id, data })}
            submitting={updateMutation.isPending}
          />
        )}
      </Modal>

      <Modal isOpen={Boolean(bookingTarget)} title={`Book: ${bookingTarget?.name}`} onClose={() => setBookingTarget(null)}>
        {bookingTarget && (
          <BookingForm
            amenity={bookingTarget}
            onSubmit={data => bookMutation.mutate({ id: bookingTarget._id, data })}
            submitting={bookMutation.isPending}
          />
        )}
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} title="Delete Amenity" onClose={() => setDeleteTarget(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: '#f1f5f9', lineHeight: 1.6 }}>
            ⚠️ Deleting <strong>{deleteTarget?.name}</strong> will cancel all future bookings. This cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn-prop btn-prop--secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-prop btn-prop--danger" disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Amenity'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{amenityStyles}</style>
    </div>
  );
};

// ── My Bookings sub-view ───────────────────────────────────────────────────────
const MyBookingsView: React.FC<{
  bookings: AmenityBooking[];
  loading: boolean;
  onCancel: (id: string) => void;
  cancelling: boolean;
}> = ({ bookings, loading, onCancel, cancelling }) => {
  if (loading) return <div className="loading-grid">{[1,2,3].map(i => <div key={i} className="property-card-skeleton" />)}</div>;
  if (!bookings.length) return (
    <div className="empty-state"><div className="empty-icon">📅</div><h3>No bookings yet</h3></div>
  );

  return (
    <div className="table-wrap">
      <table className="shared-table">
        <thead><tr><th>Amenity</th><th>Date & Time</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {bookings.map(b => {
            const amenity = typeof b.amenityId === 'object' ? b.amenityId : null;
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const durMins = Math.round((end.getTime() - start.getTime()) / 60000);
            const cfg = BOOKING_STATUS_CONFIG[b.status];
            const canCancel = ['confirmed', 'pending_approval'].includes(b.status) && start > new Date();
            return (
              <tr key={b._id}>
                <td>
                  <div className="tenant-name">{amenity ? `${AMENITY_TYPE_CONFIG[amenity.type]?.icon} ${amenity.name}` : '—'}</div>
                </td>
                <td>
                  <div className="tenant-name">{start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  <div className="tenant-email">{start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} → {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td><div className="tenant-name">{durMins}m</div></td>
                <td><span className={`shared-badge ${cfg.cls}`}>{cfg.label}</span></td>
                <td>
                  {canCancel && (
                    <button className="action-btn action-btn--delete" disabled={cancelling}
                      onClick={() => onCancel(b._id)}>Cancel</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Amenity Form ───────────────────────────────────────────────────────────────
const AmenityForm: React.FC<{
  initial?: Partial<Amenity>;
  properties: any[];
  onSubmit: (data: Partial<Amenity>) => void;
  submitting: boolean;
}> = ({ initial, properties, onSubmit, submitting }) => {
  const resolvedPropertyId = typeof initial?.propertyId === 'object'
    ? (initial.propertyId as any)._id
    : initial?.propertyId ?? '';
  const [form, setForm] = useState<Partial<Amenity>>({
    name: '', description: '', type: 'other', capacity: 10,
    bookingDurationMin: 30, bookingDurationMax: 120, advanceBookingDays: 7,
    requiresApproval: false, status: 'active', rules: [],
    ...initial,
    propertyId: resolvedPropertyId
  });
  const [rulesInput, setRulesInput] = useState((initial?.rules ?? []).join('\n'));

  const set = (k: keyof Amenity, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="property-form">
      <div className="prop-form-grid">
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Type *</label>
          <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)} disabled={submitting}>
            {(Object.keys(AMENITY_TYPE_CONFIG) as AmenityType[]).map(t => (
              <option key={t} value={t}>{AMENITY_TYPE_CONFIG[t].icon} {AMENITY_TYPE_CONFIG[t].label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Property *</label>
          <select className="form-input" value={form.propertyId as string} onChange={e => set('propertyId', e.target.value)} disabled={submitting}>
            <option value="">Select Property</option>
            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)} disabled={submitting}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="under_maintenance">Under Maintenance</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Capacity</label>
          <input type="number" className="form-input" value={form.capacity ?? 10} onChange={e => set('capacity', Number(e.target.value))} min={1} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Min Booking (min)</label>
          <input type="number" className="form-input" value={form.bookingDurationMin ?? 30} onChange={e => set('bookingDurationMin', Number(e.target.value))} min={15} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Max Booking (min)</label>
          <input type="number" className="form-input" value={form.bookingDurationMax ?? 120} onChange={e => set('bookingDurationMax', Number(e.target.value))} min={15} disabled={submitting} />
        </div>
        <div className="form-group">
          <label className="form-label">Advance Booking (days)</label>
          <input type="number" className="form-input" value={form.advanceBookingDays ?? 7} onChange={e => set('advanceBookingDays', Number(e.target.value))} min={1} disabled={submitting} />
        </div>
        <div className="form-group form-group--full">
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea" value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} disabled={submitting} />
        </div>
        <div className="form-group form-group--full">
          <label className="form-label">Rules (one per line)</label>
          <textarea className="form-input form-textarea" value={rulesInput}
            onChange={e => { setRulesInput(e.target.value); set('rules', e.target.value.split('\n').filter(Boolean)); }}
            rows={3} placeholder="No food allowed&#10;Book 24hrs in advance" disabled={submitting} />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.requiresApproval ?? false}
              onChange={e => set('requiresApproval', e.target.checked)} disabled={submitting} />
            <span className="form-label" style={{ margin: 0 }}>Requires Approval</span>
          </label>
        </div>
      </div>
      <div className="prop-form-footer">
        <button type="button" className="btn btn-primary"
          disabled={submitting || !form.name?.trim() || !form.propertyId}
          onClick={() => onSubmit(form)}>
          {submitting ? <><span className="btn-spinner" />{initial ? 'Saving…' : 'Creating…'}</> : initial ? 'Save Changes' : 'Create Amenity'}
        </button>
      </div>
    </div>
  );
};

// ── Booking Form ───────────────────────────────────────────────────────────────
const BookingForm: React.FC<{
  amenity: Amenity;
  onSubmit: (data: any) => void;
  submitting: boolean;
}> = ({ amenity, onSubmit, submitting }) => {
  const { user } = useAuth();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [startHour, setStartHour] = useState('09:00');
  const [duration, setDuration] = useState(amenity.bookingDurationMin);
  const [notes, setNotes] = useState('');

  // Fetch all bookings for this amenity
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['amenity-bookings', amenity._id],
    queryFn: () => amenityApi.listBookings(amenity._id, { limit: 100 }),
    staleTime: 10_000
  });

  const startTime = new Date(`${date}T${startHour}:00`);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const hours = Array.from({ length: 14 }, (_, i) => {
    const h = (i + 8).toString().padStart(2, '0');
    return `${h}:00`;
  });

  // Check if a slot (hourly) overlaps with any booking
  const getSlotStatus = (hourStr: string) => {
    const slotStart = new Date(`${date}T${hourStr}:00`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 1 hour slot
    
    if (isLoadingBookings) return { type: 'loading' };

    const booking = bookingsData?.bookings?.find((b: any) => {
      if (b.status === 'cancelled') return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return start < slotEnd && end > slotStart;
    });

    if (booking) {
      const tenant = typeof booking.tenantId === 'object' ? booking.tenantId : null;
      const isMyBooking = booking.tenantId?._id?.toString() === user?._id?.toString() || 
                          booking.tenantId?.toString() === user?._id?.toString();
      return {
        type: 'booked',
        isMyBooking,
        label: isMyBooking ? 'Your Booking' : (tenant?.name || 'Reserved'),
        status: booking.status
      };
    }

    return { type: 'free' };
  };

  return (
    <div className="property-form select-slot-container">
      <div style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#94a3b8' }}>
        <strong style={{ color: '#818cf8' }}>ℹ️ Rules:</strong> {amenity.capacity} person capacity · {amenity.bookingDurationMin}–{amenity.bookingDurationMax}m slots
        {amenity.requiresApproval && <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>· Requires approval</span>}
      </div>

      <div className="booking-modal-layout" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {/* Left Column: Visual Daily Timeline */}
        <div className="daily-timeline-column" style={{ flex: '1 1 300px', minWidth: '280px' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📅 Day Schedule</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})</span>
          </h4>
          
          <div className="timeline-slots-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.5rem', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', background: '#0f172a' }}>
            {hours.map(h => {
              const status = getSlotStatus(h);
              const isSelected = startHour === h;

              if (status.type === 'loading') {
                return <div key={h} className="timeline-slot timeline-slot--loading" style={{ height: '38px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }} />;
              }

              if (status.type === 'booked') {
                const bg = status.isMyBooking ? 'rgba(79, 70, 229, 0.2)' : 'rgba(239, 68, 68, 0.15)';
                const border = status.isMyBooking ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)';
                const color = status.isMyBooking ? '#818cf8' : '#ef4444';
                return (
                  <div key={h} className="timeline-slot timeline-slot--booked" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: bg, border: border, borderRadius: '6px', fontSize: '0.8rem', color: color }}>
                    <strong>{h}</strong>
                    <span>{status.label} ({status.status === 'pending_approval' ? 'Pending' : 'Confirmed'})</span>
                  </div>
                );
              }

              // Available slot
              const bg = isSelected ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
              const border = isSelected ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)';
              const color = isSelected ? '#10b981' : '#94a3b8';
              return (
                <button
                  type="button"
                  key={h}
                  className={`timeline-slot timeline-slot--free ${isSelected ? 'selected' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: bg, border: border, borderRadius: '6px', fontSize: '0.8rem', color: color, cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' }}
                  onClick={() => setStartHour(h)}
                >
                  <strong>{h}</strong>
                  <span>Available {isSelected && '✓'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Booking Inputs */}
        <div className="booking-inputs-column" style={{ flex: '1 1 250px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={date} min={todayStr}
              onChange={e => setDate(e.target.value)} disabled={submitting} />
          </div>
          <div className="form-group">
            <label className="form-label">Start Time *</label>
            <select className="form-input" value={startHour} onChange={e => setStartHour(e.target.value)} disabled={submitting}>
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (minutes)</label>
            <select className="form-input" value={duration} onChange={e => setDuration(Number(e.target.value))} disabled={submitting}>
              {Array.from({ length: Math.floor((amenity.bookingDurationMax - amenity.bookingDurationMin) / 30) + 1 }, (_, i) => {
                const mins = amenity.bookingDurationMin + i * 30;
                return <option key={mins} value={mins}>{mins} min</option>;
              })}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input className="form-input" value={endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} readOnly disabled />
          </div>
          <div className="form-group form-group--full">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input form-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={2} disabled={submitting} placeholder="Provide any additional info..." />
          </div>
        </div>
      </div>

      <div className="prop-form-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting || !date}
          onClick={() => onSubmit({ startTime: startTime.toISOString(), endTime: endTime.toISOString(), notes })}>
          {submitting ? <><span className="btn-spinner" />Booking…</> : amenity.requiresApproval ? 'Request Booking' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
};

const amenityStyles = `
.amenity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1rem; }
.amenity-card { background: var(--surface,#1e293b); border: 1px solid var(--border,#334155); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; gap: .75rem; transition: box-shadow .2s, transform .2s; }
.amenity-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.3); transform: translateY(-2px); }
.amenity-card__icon { font-size: 2rem; line-height: 1; }
.amenity-card__content { display: flex; flex-direction: column; gap: .4rem; }
.amenity-card__header { display: flex; justify-content: space-between; align-items: center; }
.amenity-card__name { font-size: .95rem; font-weight: 700; color: #f1f5f9; margin: 0; }
.amenity-card__type { font-size: .78rem; color: #818cf8; font-weight: 600; }
.amenity-card__property { font-size: .75rem; color: #64748b; }
.amenity-card__meta { display: flex; gap: .5rem; flex-wrap: wrap; font-size: .72rem; color: #94a3b8; margin-top: .25rem; }
.amenity-card__rules { display: flex; flex-wrap: wrap; gap: .35rem; }
.rule-chip { font-size: .65rem; color: #94a3b8; background: rgba(255,255,255,.05); padding: .15rem .45rem; border-radius: 6px; }
.amenity-card__actions { display: flex; gap: .4rem; margin-top: .4rem; flex-wrap: wrap; }
.btn-secondary { background: rgba(255,255,255,.05); color: #94a3b8; border: 1px solid #334155; padding: .5rem 1rem; border-radius: 8px; font-size: .85rem; font-weight: 600; cursor: pointer; transition: background .15s; }
.btn-secondary:hover { background: rgba(255,255,255,.09); }

.timeline-slots-grid::-webkit-scrollbar { width: 6px; }
.timeline-slots-grid::-webkit-scrollbar-track { background: transparent; }
.timeline-slots-grid::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
.timeline-slots-grid::-webkit-scrollbar-thumb:hover { background: #475569; }
.timeline-slot:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.timeline-slot--free:hover { border-color: #10b981 !important; color: #10b981 !important; background: rgba(16, 185, 129, 0.05) !important; }
`;

export default Amenities;
