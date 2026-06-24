import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../../lib/maintenanceApi';
import type { MaintenanceStatus, StaffUser } from '../../lib/maintenanceApi';
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_LABELS } from '../../lib/maintenanceApi';
import MaintenanceTimeline from '../../components/Maintenance/MaintenanceTimeline';
import Modal from '../../components/Admin/Modal';
import ImageUploader from '../../components/Shared/ImageUploader';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../components/Maintenance/Maintenance.css';
import '../../components/Shared/Shared.css';
import '../Properties/Properties.css';

// State machine: what transitions are allowed per role
const TRANSITIONS_BY_ROLE: Record<string, Partial<Record<MaintenanceStatus, MaintenanceStatus[]>>> = {
  maintenance_staff: {
    assigned:       ['in_progress', 'open'],
    in_progress:    ['pending_review']
  },
  property_owner: {
    open:           ['assigned', 'closed'],
    assigned:       ['in_progress', 'closed'],
    pending_review: ['resolved', 'in_progress'],
    resolved:       ['closed']
  },
  admin: {
    open:           ['assigned', 'closed'],
    assigned:       ['in_progress', 'open', 'closed'],
    in_progress:    ['pending_review', 'assigned'],
    pending_review: ['resolved', 'in_progress'],
    resolved:       ['closed'],
    closed:         []
  }
};

const MaintenanceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isTenant = user?.roles?.includes('tenant');
  const isAdmin  = user?.roles?.includes('admin');
  const isOwner  = user?.roles?.includes('property_owner');
  const isStaff  = user?.roles?.includes('maintenance_staff');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<MaintenanceStatus | ''>('');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: request, isLoading, isError } = useQuery({
    queryKey: ['maintenance-detail', id],
    queryFn: () => maintenanceApi.get(id!),
    enabled: Boolean(id)
  });

  const staffQuery = useQuery({
    queryKey: ['maintenance-staff'],
    queryFn: maintenanceApi.staff,
    enabled: isOwner || isAdmin,
    staleTime: 60_000
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const transitionMutation = useMutation({
    mutationFn: ({ status, note }: { status: MaintenanceStatus; note?: string }) =>
      maintenanceApi.transition(id!, status, note),
    onSuccess: (res) => {
      showToast(`Status → ${res.request.status}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maint-stats'] });
      setShowStatusModal(false); setStatusNote(''); setTargetStatus('');
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Transition failed', 'error')
  });

  const assignMutation = useMutation({
    mutationFn: ({ staffId, note }: { staffId: string; note?: string }) =>
      maintenanceApi.assign(id!, staffId, note),
    onSuccess: () => {
      showToast('Staff assigned', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance-detail', id] });
      setShowAssignModal(false); setSelectedStaff('');
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Assignment failed', 'error')
  });

  const feedbackMutation = useMutation({
    mutationFn: () => maintenanceApi.feedback(id!, rating, feedbackText),
    onSuccess: () => {
      showToast('Feedback submitted — thank you!', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance-detail', id] });
      setShowFeedbackModal(false);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed', 'error')
  });

  const uploadAttachmentsMutation = useMutation({
    mutationFn: (files: File[]) => maintenanceApi.uploadAttachments(id!, files),
    onSuccess: () => {
      showToast('Photos uploaded', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance-detail', id] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Upload failed', 'error')
  });

  if (isLoading) return (
    <div className="properties-page"><div className="page-container">
      <div className="empty-state"><div className="loading-spinner" /><p>Loading request…</p></div>
    </div></div>
  );

  if (isError || !request) return (
    <div className="properties-page"><div className="page-container">
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Request not found</h3>
        <Link to="/maintenance" className="btn btn-primary">← Back</Link>
      </div>
    </div></div>
  );

  const tenant   = typeof request.tenantId   === 'object' ? request.tenantId   : null;
  const property = typeof request.propertyId === 'object' ? request.propertyId : null;
  const assigned = request.assignedTo && typeof request.assignedTo === 'object' ? request.assignedTo : null;
  const priorityCfg = PRIORITY_CONFIG[request.priority];
  const statusCfg   = STATUS_CONFIG[request.status];

  // Determine available transitions for this user
  const userRole = isAdmin ? 'admin' : isOwner ? 'property_owner' : isStaff ? 'maintenance_staff' : null;
  const availableTransitions = userRole ? (TRANSITIONS_BY_ROLE[userRole]?.[request.status] ?? []) : [];

  const canAssign   = (isAdmin || isOwner) && ['open', 'assigned'].includes(request.status);
  const canFeedback = isTenant && ['resolved', 'closed'].includes(request.status) && !request.tenantRating;

  const allStatuses: MaintenanceStatus[] = ['open', 'assigned', 'in_progress', 'pending_review', 'resolved', 'closed'];
  const currentIdx = allStatuses.indexOf(request.status);

  return (
    <div className="properties-page">
      <div className="page-container">

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <div className="breadcrumb">
          <Link to="/maintenance" className="breadcrumb__link">Maintenance</Link>
          <span className="breadcrumb__sep">›</span>
          <span style={{ color: '#94a3b8' }}>{request.title.slice(0, 40)}</span>
        </div>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="page-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span className="priority-badge" style={{ color: priorityCfg.color, background: priorityCfg.bg }}>
                {priorityCfg.label} Priority
              </span>
              <span className={`shared-badge ${statusCfg.cls}`}>{statusCfg.label}</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{CATEGORY_LABELS[request.category]}</span>
            </div>
            <h1 className="page-title" style={{ fontSize: '1.4rem' }}>{request.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {availableTransitions.length > 0 && (
              <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setShowStatusModal(true)}>
                Update Status
              </button>
            )}
            {canAssign && (
              <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setShowAssignModal(true)}>
                {assigned ? 'Reassign Staff' : 'Assign Staff'}
              </button>
            )}
            {canFeedback && (
              <button className="btn btn-primary" style={{ fontSize: '0.85rem', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                onClick={() => setShowFeedbackModal(true)}>
                ⭐ Rate
              </button>
            )}
          </div>
        </div>

        {/* ── Status Stepper ───────────────────────────────────────────── */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingBottom: 8, minWidth: 400 }}>
            {allStatuses.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: i < currentIdx ? '#4f46e5' : i === currentIdx ? '#10b981' : '#334155',
                    border: `2px solid ${i < currentIdx ? '#818cf8' : i === currentIdx ? '#34d399' : '#475569'}`,
                    boxShadow: i === currentIdx ? '0 0 8px rgba(16,185,129,0.5)' : 'none'
                  }} />
                  <span style={{ fontSize: '0.6rem', color: i <= currentIdx ? '#94a3b8' : '#475569', whiteSpace: 'nowrap' }}>
                    {STATUS_CONFIG[s].label}
                  </span>
                </div>
                {i < allStatuses.length - 1 && (
                  <div style={{ height: 2, width: 40, background: i < currentIdx ? '#4f46e5' : '#334155', flexShrink: 0, marginBottom: 16 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Main Detail Grid ─────────────────────────────────────────── */}
        <div className="maintenance-detail-grid">
          {/* Left: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Description */}
            <div className="info-card">
              <h3 className="info-card__title">📋 Description</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{request.description}</p>
            </div>

            {/* People */}
            <div className="info-card">
              <h3 className="info-card__title">👥 People</h3>
              <div className="info-rows">
                {tenant && (
                  <div className="info-row">
                    <span className="info-label">Submitted by</span>
                    <span className="info-value">{tenant.name} · {tenant.email}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Property / Unit</span>
                  <span className="info-value">{property?.name ?? '—'} · Unit {request.unitNumber}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Assigned Staff</span>
                  <span className="info-value">{assigned ? `${assigned.name} (${assigned.email})` : 'Unassigned'}</span>
                </div>
                {request.resolvedAt && (
                  <div className="info-row">
                    <span className="info-label">Resolved</span>
                    <span className="info-value">{new Date(request.resolvedAt).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating (if submitted) */}
            {request.tenantRating && (
              <div className="info-card">
                <h3 className="info-card__title">⭐ Tenant Feedback</h3>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ fontSize: '1.4rem', filter: n <= request.tenantRating! ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
                  ))}
                </div>
                {request.tenantFeedback && <p style={{ color: '#94a3b8', margin: 0 }}>{request.tenantFeedback}</p>}
              </div>
            )}

            {/* Attachments / Photos */}
            <div className="info-card">
              <h3 className="info-card__title">📸 Photos & Attachments</h3>
              
              {(request.attachments && request.attachments.length > 0) ? (
                <div className="img-gallery">
                  {request.attachments.map((att, idx) => (
                    <div key={idx} className="img-gallery__item" onClick={() => window.open(att.url, '_blank')} title={att.name}>
                      <img src={att.url} alt={att.name} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', margin: '0 0 1rem' }}>No photos attached.</p>
              )}

              <div style={{ marginTop: '1rem' }}>
                <ImageUploader
                  maxFiles={5}
                  onUpload={async (files) => { await uploadAttachmentsMutation.mutateAsync(files); }}
                  label="Add Photos"
                  loading={uploadAttachmentsMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Right: Timeline */}
          <div className="info-card" style={{ position: 'sticky', top: '90px' }}>
            <h3 className="info-card__title">🕐 Timeline</h3>
            <MaintenanceTimeline timeline={request.timeline} />
          </div>
        </div>
      </div>

      {/* ── Update Status Modal ───────────────────────────────────────────── */}
      <Modal isOpen={showStatusModal} title="Update Status" onClose={() => setShowStatusModal(false)}>
        <div className="property-form">
          <div className="form-group">
            <label className="form-label">New Status *</label>
            <select className="form-input" value={targetStatus} onChange={e => setTargetStatus(e.target.value as MaintenanceStatus)}>
              <option value="">Select new status…</option>
              {availableTransitions.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <textarea className="form-input form-textarea" rows={3} value={statusNote}
              onChange={e => setStatusNote(e.target.value)} placeholder="Add context about this update…" />
          </div>
          <div className="prop-form-footer">
            <button className="btn btn-primary" disabled={!targetStatus || transitionMutation.isPending}
              onClick={() => transitionMutation.mutate({ status: targetStatus as MaintenanceStatus, note: statusNote })}>
              {transitionMutation.isPending ? 'Updating…' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Assign Staff Modal ────────────────────────────────────────────── */}
      <Modal isOpen={showAssignModal} title="Assign Maintenance Staff" onClose={() => setShowAssignModal(false)}>
        <div className="property-form">
          <div className="staff-list">
            {(staffQuery.data ?? []).length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No maintenance staff found. Add staff users first.</p>
            ) : (
              (staffQuery.data as StaffUser[]).map(s => (
                <button key={s._id} className={`staff-option ${selectedStaff === s._id ? 'selected' : ''}`}
                  onClick={() => setSelectedStaff(s._id)}>
                  <div className="staff-avatar">{s.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="staff-name">{s.name}</div>
                    <div className="staff-email">{s.email}</div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="prop-form-footer" style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" disabled={!selectedStaff || assignMutation.isPending}
              onClick={() => assignMutation.mutate({ staffId: selectedStaff })}>
              {assignMutation.isPending ? 'Assigning…' : 'Assign Staff'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Feedback Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={showFeedbackModal} title="Rate this Resolution" onClose={() => setShowFeedbackModal(false)}>
        <div className="property-form">
          <div className="form-group">
            <label className="form-label">Rating *</label>
            <div className="star-rating">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`star ${n <= rating ? 'filled' : ''}`} onClick={() => setRating(n)}>⭐</span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Feedback (optional)</label>
            <textarea className="form-input form-textarea" rows={3} value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)} placeholder="How was the service?" />
          </div>
          <div className="prop-form-footer">
            <button className="btn btn-primary" disabled={!rating || feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate()}>
              {feedbackMutation.isPending ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .info-card { background: var(--surface,#1e293b); border: 1px solid var(--border,#334155); border-radius: 16px; padding: 1.5rem; }
        .info-card__title { font-size: 0.8rem; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: .05em; margin: 0 0 1rem; padding-bottom: .5rem; border-bottom: 1px solid var(--border,#334155); }
        .info-rows { display: flex; flex-direction: column; gap: .6rem; }
        .info-row { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
        .info-label { font-size: .78rem; color: #94a3b8; white-space: nowrap; }
        .info-value { font-size: .875rem; font-weight: 600; color: #f1f5f9; text-align: right; }
        .breadcrumb { display: flex; align-items: center; gap: .5rem; margin-bottom: 1.5rem; font-size: .875rem; color: #94a3b8; }
        .breadcrumb__link { color: #818cf8; text-decoration: none; }
        .breadcrumb__link:hover { text-decoration: underline; }
        .breadcrumb__sep { color: #475569; }
        .btn-secondary { background: var(--surface,#1e293b); color: var(--text-muted,#94a3b8); border: 1px solid var(--border,#334155); padding: .6rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background .15s; font-size: .85rem; }
        .btn-secondary:hover { background: #263045; }
      `}</style>
    </div>
  );
};

export default MaintenanceDetail;
