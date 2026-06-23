// client/src/lib/tenantApi.ts — PropSync v2
import { api } from './api';

export type TenantStatus = 'active' | 'notice_period' | 'vacated' | 'pending_verification';
export type DocumentType = 'id_proof' | 'lease' | 'income_proof' | 'other';

export interface TenantDocument {
  _id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
}

export interface TenantStats {
  total: number;
  active: number;
  notice_period: number;
  vacated: number;
  pending: number;
}

export interface Tenant {
  _id: string;
  userId: { _id: string; name: string; email: string; phone?: string } | string;
  propertyId: {
    _id: string;
    name: string;
    address: { street: string; city: string; state: string };
    ownerId?: string;
  } | string;
  unitNumber: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  depositPaid: number;
  rentDueDay: number;
  status: TenantStatus;
  emergencyContact: { name: string | null; phone: string | null; relation: string | null };
  documents: TenantDocument[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus | '';
  propertyId?: string;
}

export interface CreateTenantPayload {
  userId: string;
  propertyId: string;
  unitNumber: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  depositPaid?: number;
  rentDueDay?: number;
  notes?: string;
  emergencyContact?: { name?: string; phone?: string; relation?: string };
}

export const tenantApi = {
  list: (params: ListTenantsParams = {}) =>
    api.get<{ tenants: Tenant[]; meta: { total: number; totalPages: number; page: number; limit: number } }>(
      '/tenants', { params }
    ).then(r => r.data),

  stats: () => api.get<TenantStats>('/tenants/stats').then(r => r.data),

  expiring: (days = 30) =>
    api.get<Tenant[]>('/tenants/expiring', { params: { days } }).then(r => r.data),

  me: () => api.get<Tenant>('/tenants/me').then(r => r.data),

  get: (id: string) => api.get<Tenant>(`/tenants/${id}`).then(r => r.data),

  create: (data: CreateTenantPayload) =>
    api.post<{ message: string; tenant: Tenant }>('/tenants', data).then(r => r.data),

  update: (id: string, data: Partial<Tenant>) =>
    api.put<{ message: string; tenant: Tenant }>(`/tenants/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/tenants/${id}`).then(r => r.data)
};
