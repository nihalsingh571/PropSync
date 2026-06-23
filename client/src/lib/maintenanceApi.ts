// client/src/lib/maintenanceApi.ts — PropSync v2
import { api } from './api';

export type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'resolved' | 'closed';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceCategory =
  | 'plumbing' | 'electrical' | 'hvac' | 'appliance'
  | 'structural' | 'pest_control' | 'cleaning' | 'security' | 'internet' | 'other';

export interface TimelineEvent {
  _id: string;
  status: MaintenanceStatus;
  note: string;
  changedBy: { _id: string; name: string; email: string } | string;
  changedAt: string;
}

export interface MaintenanceRequest {
  _id: string;
  tenantId: { _id: string; name: string; email: string; phone?: string } | string;
  propertyId: { _id: string; name: string; address: { street: string; city: string; state: string }; ownerId?: string } | string;
  unitNumber: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  attachments: { url: string; name: string; type: string }[];
  assignedTo: { _id: string; name: string; email: string; phone?: string } | null;
  assignedAt: string | null;
  status: MaintenanceStatus;
  timeline: TimelineEvent[];
  resolvedAt: string | null;
  resolutionNote: string | null;
  tenantRating: number | null;
  tenantFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceStats {
  total: number;
  open: number;
  assigned: number;
  in_progress: number;
  pending_review: number;
  resolved: number;
  closed: number;
  urgent: number;
  high: number;
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface ListMaintenanceParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MaintenanceStatus | '';
  priority?: MaintenancePriority | '';
  category?: MaintenanceCategory | '';
  propertyId?: string;
}

export interface CreateMaintenancePayload {
  propertyId: string;
  unitNumber: string;
  title: string;
  description: string;
  category?: MaintenanceCategory;
  priority?: MaintenancePriority;
}

// ── Priority config ─────────────────────────────────────────────────────────
export const PRIORITY_CONFIG: Record<MaintenancePriority, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  high:   { label: 'High',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  medium: { label: 'Medium',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  low:    { label: 'Low',     color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
};

export const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; cls: string }> = {
  open:           { label: 'Open',           cls: 'badge--open' },
  assigned:       { label: 'Assigned',       cls: 'badge--in-progress' },
  in_progress:    { label: 'In Progress',    cls: 'badge--in-progress' },
  pending_review: { label: 'Pending Review', cls: 'badge--notice' },
  resolved:       { label: 'Resolved',       cls: 'badge--resolved' },
  closed:         { label: 'Closed',         cls: 'badge--closed' }
};

export const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  plumbing: '🔧 Plumbing', electrical: '⚡ Electrical', hvac: '❄️ HVAC',
  appliance: '🏠 Appliance', structural: '🏗️ Structural', pest_control: '🐛 Pest Control',
  cleaning: '🧹 Cleaning', security: '🔐 Security', internet: '📡 Internet', other: '📋 Other'
};

export const maintenanceApi = {
  stats: () => api.get<MaintenanceStats>('/maintenance/stats').then(r => r.data),

  staff: () => api.get<StaffUser[]>('/maintenance/staff').then(r => r.data),

  list: (params: ListMaintenanceParams = {}) =>
    api.get<{ requests: MaintenanceRequest[]; meta: { total: number; totalPages: number; page: number; limit: number } }>(
      '/maintenance', { params }
    ).then(r => r.data),

  get: (id: string) => api.get<MaintenanceRequest>(`/maintenance/${id}`).then(r => r.data),

  create: (data: CreateMaintenancePayload) =>
    api.post<{ message: string; request: MaintenanceRequest }>('/maintenance', data).then(r => r.data),

  update: (id: string, data: Partial<MaintenanceRequest>) =>
    api.put<{ message: string; request: MaintenanceRequest }>(`/maintenance/${id}`, data).then(r => r.data),

  transition: (id: string, status: MaintenanceStatus, note?: string) =>
    api.patch<{ message: string; request: MaintenanceRequest }>(`/maintenance/${id}/status`, { status, note }).then(r => r.data),

  assign: (id: string, staffUserId: string, note?: string) =>
    api.patch<{ message: string; request: MaintenanceRequest }>(`/maintenance/${id}/assign`, { staffUserId, note }).then(r => r.data),

  feedback: (id: string, rating: number, feedback?: string) =>
    api.patch<{ message: string; request: MaintenanceRequest }>(`/maintenance/${id}/feedback`, { rating, feedback }).then(r => r.data),

  delete: (id: string) => api.delete<{ message: string }>(`/maintenance/${id}`).then(r => r.data)
};
