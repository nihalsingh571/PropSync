// client/src/lib/propertyApi.ts — PropSync v2
// All property API calls in one place.

import { api } from './api';

export type PropertyStatus = 'active' | 'inactive' | 'under_maintenance';
export type PropertyType = 'apartment' | 'villa' | 'commercial' | 'co-living' | 'independent_house';
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance' | 'reserved';

export interface Unit {
  _id: string;
  unitNumber: string;
  floor: number | null;
  bedrooms: number;
  bathrooms: number;
  area: number | null;
  monthlyRent: number;
  depositAmount: number;
  status: UnitStatus;
  tenantId: string | null;
}

export interface Property {
  _id: string;
  name: string;
  description: string;
  ownerId: { _id: string; name: string; email: string; phone?: string } | string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  type: PropertyType;
  totalUnits: number;
  yearBuilt: number | null;
  units: Unit[];
  status: PropertyStatus;
  images: string[];
  coverImage: string | null;
  occupancyRate: number;
  occupiedUnits: number;
  vacantUnits: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalMonthlyRevenue: number;
}

export interface ListPropertiesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PropertyStatus | '';
  city?: string;
  type?: PropertyType | '';
}

// ── API Calls ─────────────────────────────────────────────────────────────────

export const propertyApi = {
  list: (params: ListPropertiesParams = {}) =>
    api.get<{ properties: Property[]; meta: { total: number; totalPages: number; page: number; limit: number } }>(
      '/properties',
      { params }
    ).then(r => r.data),

  stats: () =>
    api.get<PropertyStats>('/properties/stats').then(r => r.data),

  get: (id: string) =>
    api.get<Property>(`/properties/${id}`).then(r => r.data),

  create: (data: Partial<Property>) =>
    api.post<{ message: string; property: Property }>('/properties', data).then(r => r.data),

  update: (id: string, data: Partial<Property>) =>
    api.put<{ message: string; property: Property }>(`/properties/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/properties/${id}`).then(r => r.data),

  // Unit management
  addUnit: (propertyId: string, unitData: Partial<Unit>) =>
    api.post<{ message: string; property: Property }>(`/properties/${propertyId}/units`, unitData).then(r => r.data),

  updateUnit: (propertyId: string, unitId: string, unitData: Partial<Unit>) =>
    api.put<{ message: string; property: Property }>(`/properties/${propertyId}/units/${unitId}`, unitData).then(r => r.data),

  deleteUnit: (propertyId: string, unitId: string) =>
    api.delete<{ message: string; property: Property }>(`/properties/${propertyId}/units/${unitId}`).then(r => r.data),

  // Image upload
  uploadImages: (propertyId: string, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    return api.post<{ message: string; images: string[]; coverImage: string }>(
      `/properties/${propertyId}/images`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  }
};
