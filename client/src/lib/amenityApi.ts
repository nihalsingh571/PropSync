// client/src/lib/amenityApi.ts — PropSync v2
import { api } from './api';

export type AmenityStatus = 'active' | 'inactive' | 'under_maintenance';
export type AmenityType =
  | 'gym' | 'swimming_pool' | 'meeting_room' | 'rooftop' | 'clubhouse'
  | 'playground' | 'parking' | 'laundry' | 'bbq_area' | 'game_room' | 'other';

export type BookingStatus = 'pending_approval' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Amenity {
  _id: string;
  name: string;
  description: string;
  type: AmenityType;
  propertyId: { _id: string; name: string; address: { street: string; city: string; state: string }; ownerId?: string } | string;
  capacity: number;
  bookingDurationMin: number;
  bookingDurationMax: number;
  advanceBookingDays: number;
  requiresApproval: boolean;
  operatingHours: OperatingHours[];
  status: AmenityStatus;
  images: string[];
  rules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AmenityBooking {
  _id: string;
  amenityId: { _id: string; name: string; type: AmenityType; capacity: number } | string;
  tenantId: { _id: string; name: string; email: string; phone?: string } | string;
  propertyId: { _id: string; name: string } | string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  cancellationReason: string | null;
  cancelledAt: string | null;
  notes: string;
  rating: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AmenityStats {
  total: number;
  active: number;
  inactive: number;
  under_maintenance: number;
}

export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

export const AMENITY_TYPE_CONFIG: Record<AmenityType, { label: string; icon: string }> = {
  gym:           { label: 'Gym',          icon: '🏋️' },
  swimming_pool: { label: 'Pool',         icon: '🏊' },
  meeting_room:  { label: 'Meeting Room', icon: '📋' },
  rooftop:       { label: 'Rooftop',      icon: '🌇' },
  clubhouse:     { label: 'Clubhouse',    icon: '🏡' },
  playground:    { label: 'Playground',   icon: '🛝' },
  parking:       { label: 'Parking',      icon: '🅿️' },
  laundry:       { label: 'Laundry',      icon: '🧺' },
  bbq_area:      { label: 'BBQ Area',     icon: '🔥' },
  game_room:     { label: 'Game Room',    icon: '🎮' },
  other:         { label: 'Other',        icon: '🏢' }
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; cls: string }> = {
  pending_approval: { label: 'Pending',   cls: 'badge--notice' },
  confirmed:        { label: 'Confirmed', cls: 'badge--active' },
  cancelled:        { label: 'Cancelled', cls: 'badge--vacated' },
  completed:        { label: 'Completed', cls: 'badge--resolved' },
  no_show:          { label: 'No Show',   cls: 'badge--closed' }
};

export const amenityApi = {
  // Amenity CRUD
  stats: () => api.get<AmenityStats>('/amenities/stats').then(r => r.data),
  list: (params: Record<string, any> = {}) =>
    api.get<{ amenities: Amenity[]; meta: any }>('/amenities', { params }).then(r => r.data),
  get: (id: string) => api.get<Amenity>(`/amenities/${id}`).then(r => r.data),
  create: (data: Partial<Amenity>) =>
    api.post<{ message: string; amenity: Amenity }>('/amenities', data).then(r => r.data),
  update: (id: string, data: Partial<Amenity>) =>
    api.put<{ message: string; amenity: Amenity }>(`/amenities/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete<{ message: string }>(`/amenities/${id}`).then(r => r.data),

  // Bookings
  bookingStats: () => api.get<BookingStats>('/amenities/bookings/stats').then(r => r.data),
  myBookings: (params: Record<string, any> = {}) =>
    api.get<{ bookings: AmenityBooking[]; meta: any }>('/amenities/my-bookings', { params }).then(r => r.data),
  listBookings: (amenityId: string, params: Record<string, any> = {}) =>
    api.get<{ bookings: AmenityBooking[]; meta: any }>(`/amenities/${amenityId}/bookings`, { params }).then(r => r.data),
  book: (amenityId: string, data: { startTime: string; endTime: string; notes?: string }) =>
    api.post<{ message: string; booking: AmenityBooking }>(`/amenities/${amenityId}/book`, data).then(r => r.data),
  cancel: (bookingId: string, reason?: string) =>
    api.patch<{ message: string; booking: AmenityBooking }>(`/amenities/bookings/${bookingId}/cancel`, { reason }).then(r => r.data),
  approve: (bookingId: string) =>
    api.patch<{ message: string; booking: AmenityBooking }>(`/amenities/bookings/${bookingId}/approve`, {}).then(r => r.data),
  feedback: (bookingId: string, rating: number, feedback?: string) =>
    api.patch<{ message: string; booking: AmenityBooking }>(`/amenities/bookings/${bookingId}/feedback`, { rating, feedback }).then(r => r.data)
};
