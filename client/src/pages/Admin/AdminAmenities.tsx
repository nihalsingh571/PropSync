import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import Modal from '../../components/Admin/Modal';
import { amenityApi } from '../../lib/amenityApi';
import type { Amenity, AmenityBooking, BookingStatus } from '../../lib/amenityApi';
import { AMENITY_TYPE_CONFIG, BOOKING_STATUS_CONFIG } from '../../lib/amenityApi';
import { useToast } from '../../contexts/ToastContext';
import '../../components/Shared/Shared.css';
import '../../pages/Properties/Properties.css';

const AdminAmenities: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'amenities' | 'bookings'>('amenities');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [deletingAmenityId, setDeletingAmenityId] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | ''>('');
  const [viewingAmenity, setViewingAmenity] = useState<Amenity | null>(null);

  const amenityStatsQuery = useQuery({ queryKey: ['admin-amenity-stats'], queryFn: amenityApi.stats, staleTime: 30_000 });
  const bookingStatsQuery = useQuery({ queryKey: ['admin-booking-stats'], queryFn: amenityApi.bookingStats, staleTime: 30_000 });
  const amenitiesQuery = useQuery({ queryKey: ['admin-amenities'], queryFn: () => amenityApi.list({ limit: 100 }), staleTime: 30_000 });
  const bookingsQuery = useQuery({
    queryKey: ['admin-all-bookings', bookingFilter],
    queryFn: () => amenityApi.listBookings('', { status: bookingFilter || undefined, limit: 50 }),
    staleTime: 30_000,
    enabled: tab === 'bookings'
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => amenityApi.delete(id),
    onSuccess: () => {
      showToast('Amenity deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-amenity-stats'] });
      setDeletingAmenityId(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Delete failed', 'error')
  });

  const approveMutation = useMutation({
    mutationFn: (bookingId: string) => amenityApi.approve(bookingId),
    onSuccess: () => {
      showToast('Booking approved!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed', 'error')
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => amenityApi.cancel(bookingId, 'Cancelled by admin'),
    onSuccess: () => {
      showToast('Booking cancelled', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed', 'error')
  });

  const as = amenityStatsQuery.data;
  const bs = bookingStatsQuery.data;
  const amenities = amenitiesQuery.data?.amenities ?? [];
  const bookings = bookingsQuery.data?.bookings ?? [];

  return (
    <AdminLayout>
      <AdminHeader
        title="Amenity Management"
        onRefresh={() => {
          setLastRefresh(new Date());
          queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
          queryClient.invalidateQueries({ queryKey: ['admin-amenity-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
        }}
        isRefreshing={amenitiesQuery.isFetching || bookingsQuery.isFetching}
        lastUpdated={lastRefresh}
      />

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <div className="prop-stats-strip" style={{ marginBottom: '1.5rem' }}>
        {as && <>
          <div className="prop-stat-pill"><span className="prop-stat-pill__num">{as.total}</span><span>Amenities</span></div>
          <div className="prop-stat-pill prop-stat-pill--green"><span className="prop-stat-pill__num">{as.active}</span><span>Active</span></div>
          <div className="prop-stat-pill"><span className="prop-stat-pill__num">{as.under_maintenance}</span><span>Maintenance</span></div>
        </>}
        {bs && <>
          <div className="prop-stat-pill prop-stat-pill--accent"><span className="prop-stat-pill__num">{bs.confirmed}</span><span>Confirmed</span></div>
          <div className="prop-stat-pill"><span className="prop-stat-pill__num" style={{ color: '#f59e0b' }}>{bs.pending}</span><span>Pending</span></div>
          <div className="prop-stat-pill prop-stat-pill--green"><span className="prop-stat-pill__num">{bs.completed}</span><span>Completed</span></div>
        </>}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['amenities', 'bookings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.4rem 1.1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all .15s',
            background: tab === t ? '#4f46e5' : 'transparent',
            color: tab === t ? '#fff' : '#94a3b8'
          }}>
            {t === 'amenities' ? '🏊 Amenities' : '📅 Bookings'}
          </button>
        ))}
      </div>

      {/* ── Amenities Tab ────────────────────────────────────────────────── */}
      {tab === 'amenities' && (
        amenitiesQuery.isLoading ? (
          <div className="loading-grid">{[1,2,3,4].map(i => <div key={i} className="property-card-skeleton" />)}</div>
        ) : (
          <div className="table-wrap">
            <table className="shared-table">
              <thead><tr><th>Amenity</th><th>Type</th><th>Property</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {amenities.map(a => {
                  const prop = typeof a.propertyId === 'object' ? a.propertyId : null;
                  const cfg = AMENITY_TYPE_CONFIG[a.type];
                  return (
                    <tr key={a._id}>
                      <td>
                        <div className="tenant-cell">
                          <div style={{ fontSize: '1.5rem' }}>{cfg.icon}</div>
                          <div>
                            <div className="tenant-name">{a.name}</div>
                            {a.requiresApproval && <div className="tenant-email">Requires approval</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="tenant-name">{cfg.label}</span></td>
                      <td><span className="tenant-name">{prop?.name ?? '—'}</span></td>
                      <td><span className="tenant-name">{a.capacity}</span></td>
                      <td>
                        <span className={`shared-badge ${a.status === 'active' ? 'badge--active' : a.status === 'under_maintenance' ? 'badge--notice' : 'badge--closed'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn action-btn--view" onClick={() => setViewingAmenity(a)}>View</button>
                          <button className="action-btn action-btn--delete" onClick={() => setDeletingAmenityId(a._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Bookings Tab ─────────────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <>
          <div className="prop-filters" style={{ marginBottom: '1rem' }}>
            <select className="form-input prop-filter-select" value={bookingFilter}
              onChange={e => setBookingFilter(e.target.value as BookingStatus | '')}>
              <option value="">All Status</option>
              {(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[]).map(s => (
                <option key={s} value={s}>{BOOKING_STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
          <div className="table-wrap">
            <table className="shared-table">
              <thead><tr><th>Tenant</th><th>Amenity</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {bookings.map((b: AmenityBooking) => {
                  const tenant = typeof b.tenantId === 'object' ? b.tenantId : null;
                  const amenity = typeof b.amenityId === 'object' ? b.amenityId : null;
                  const start = new Date(b.startTime);
                  const end = new Date(b.endTime);
                  const cfg = BOOKING_STATUS_CONFIG[b.status];
                  return (
                    <tr key={b._id}>
                      <td>
                        <div className="tenant-name">{tenant?.name ?? '—'}</div>
                        <div className="tenant-email">{tenant?.email ?? '—'}</div>
                      </td>
                      <td>
                        <div className="tenant-name">{amenity ? `${AMENITY_TYPE_CONFIG[amenity.type]?.icon} ${amenity.name}` : '—'}</div>
                      </td>
                      <td>
                        <div className="tenant-name">{start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="tenant-email">
                          {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} → {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td><span className={`shared-badge ${cfg.cls}`}>{cfg.label}</span></td>
                      <td>
                        <div className="action-btns">
                          {b.status === 'pending_approval' && (
                            <button className="action-btn action-btn--view" onClick={() => approveMutation.mutate(b._id)}>Approve</button>
                          )}
                          {['confirmed', 'pending_approval'].includes(b.status) && start > new Date() && (
                            <button className="action-btn action-btn--delete" onClick={() => cancelMutation.mutate(b._id)}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Amenity Detail Modal ────────────────────────────────────────── */}
      <Modal isOpen={Boolean(viewingAmenity)} title="Amenity Details" onClose={() => setViewingAmenity(null)}>
        {viewingAmenity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              ['Name', viewingAmenity.name],
              ['Type', `${AMENITY_TYPE_CONFIG[viewingAmenity.type].icon} ${AMENITY_TYPE_CONFIG[viewingAmenity.type].label}`],
              ['Status', viewingAmenity.status],
              ['Capacity', viewingAmenity.capacity],
              ['Min Booking', `${viewingAmenity.bookingDurationMin} min`],
              ['Max Booking', `${viewingAmenity.bookingDurationMax} min`],
              ['Advance Booking', `${viewingAmenity.advanceBookingDays} days`],
              ['Requires Approval', viewingAmenity.requiresApproval ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{label}</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.875rem' }}>{String(value)}</span>
              </div>
            ))}
            {viewingAmenity.rules.length > 0 && (
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.35rem' }}>Rules</p>
                {viewingAmenity.rules.map((r, i) => (
                  <div key={i} style={{ color: '#f1f5f9', fontSize: '0.82rem', padding: '0.25rem 0' }}>📌 {r}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(deletingAmenityId)} title="Delete Amenity" onClose={() => setDeletingAmenityId(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ color: '#f1f5f9', lineHeight: 1.6 }}>
            ⚠️ Deleting this amenity will cancel all future bookings. This cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn-prop btn-prop--secondary" onClick={() => setDeletingAmenityId(null)}>Cancel</button>
            <button className="btn-prop btn-prop--danger" disabled={deleteMutation.isPending}
              onClick={() => deletingAmenityId && deleteMutation.mutate(deletingAmenityId)}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Amenity'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminAmenities;
