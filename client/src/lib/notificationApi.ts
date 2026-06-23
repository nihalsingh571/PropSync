// client/src/lib/notificationApi.ts — PropSync v2
import { api } from './api';

export interface AppNotification {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  actionUrl: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  unreadCount: number;
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  maintenance_submitted:     '🔧',
  maintenance_assigned:      '👷',
  maintenance_status_updated:'🔄',
  maintenance_resolved:      '✅',
  booking_confirmed:         '📅',
  booking_cancelled:         '❌',
  booking_reminder:          '⏰',
  lease_expiring:            '⚠️',
  rent_due:                  '💳',
  new_tenant_joined:         '🙋',
  property_announcement:     '📢',
  admin_action:              '🛡️',
  system_alert:              '🚨',
  welcome:                   '👋'
};

export const notificationApi = {
  unreadCount: () =>
    api.get<{ unreadCount: number }>('/notifications/unread-count').then(r => r.data),

  list: (params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) =>
    api.get<NotificationListResponse>('/notifications', { params }).then(r => r.data),

  markRead: (id: string) =>
    api.patch<{ message: string }>(`/notifications/${id}/read`, {}).then(r => r.data),

  markAllRead: () =>
    api.patch<{ message: string; modifiedCount: number }>('/notifications/mark-all-read', {}).then(r => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/notifications/${id}`).then(r => r.data),

  purgeRead: () =>
    api.delete<{ message: string; deletedCount: number }>('/notifications/purge-read').then(r => r.data)
};
