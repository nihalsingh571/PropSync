import { api } from './api';

export interface RecentActivityItem {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  adminId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface DashboardStatsResponse {
  totals: {
    users: number;
    neighborhoods: number;
    reviews: number;
  };
  newUsers: {
    today: number;
    week: number;
    month: number;
  };
  activeUsers: number;
  recentActivity: RecentActivityItem[];
  heatmap: Array<{ day: string; hour: number; count: number }>;
}

export interface UserAnalyticsResponse {
  dailyCounts: Array<{ date: string; count: number }>;
  roleDistribution: Array<{ _id: string; count: number }>;
}

export interface ActivityLogResponse {
  data: RecentActivityItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  roles?: string[];
  isAdmin?: boolean;
  city?: string | null;
  familyStatus?: string | null;
  suspended?: boolean;
  softDeleted?: boolean;
  createdAt?: string;
  lastActive?: string;
}

export interface UserPreferencesData {
  lifestyle?: Record<string, number>;
  demographics?: {
    age?: number;
    occupation?: string;
    familyStatus?: string;
    budget?: {
      min?: number;
      max?: number;
    };
  };
  location?: {
    currentCity?: string;
    preferredCities?: string[];
    maxCommuteTime?: number;
  };
}

export interface UserDetailResponse {
  user: AdminUser;
  preferences?: UserPreferencesData;
  reviews?: Array<{
    neighborhood: string;
    city: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
}

export interface SystemHealthResponse {
  uptime: number;
  dbStatus: string;
  memoryUsage?: Record<string, number>;
  timestamp: string;
}

export const adminApi = {
  getDashboardStats: async (range = '7d') => {
    const res = await api.get<DashboardStatsResponse>(`/admin/dashboard-stats?range=${range}`);
    return res.data;
  },
  getSystemHealth: async () => {
    const { data } = await api.get<SystemHealthResponse>('/admin/system-health');
    return data;
  },
  triggerBackup: async () => {
    const { data } = await api.post<{ jobId: string; status: string }>('/admin/backup');
    return data;
  },
  getUserAnalytics: async (range = '30d') => {
    const res = await api.get<UserAnalyticsResponse>(`/admin/user-analytics?range=${range}`);
    return res.data;
  },
  getUsers: async () => {
    const { data } = await api.get<{ users: AdminUser[]; meta: any }>('/auth/users');
    return data.users;
  },
  toggleUserAdmin: async (userId: string, isAdmin: boolean) => {
    const { data } = await api.put<{ message: string; isAdmin: boolean }>(`/auth/users/${userId}/admin`, {
      isAdmin
    });
    return data;
  },
  runUserBulkAction: async (action: string, userIds: string[], payload: Record<string, unknown> = {}) => {
    const { data } = await api.post('/admin/users/bulk-actions', {
      action,
      userIds,
      payload
    });
    return data;
  },
  getActivityLog: async (page = 1, limit = 10) => {
    const { data } = await api.get<ActivityLogResponse>('/admin/activity-log', {
      params: { page, limit }
    });
    return data;
  },
  getUserDetail: async (userId: string) => {
    const { data } = await api.get<UserDetailResponse>(`/admin/users/${userId}`);
    return data;
  },
  exportUsers: async () => {
    const { data } = await api.get<Blob>('/admin/users/export', {
      responseType: 'blob'
    });
    return data;
  },
  getNeighborhood: async (id: string) => {
    const { data } = await api.get(`/neighborhoods/${id}`);
    return data;
  },
  createNeighborhood: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/neighborhoods', payload);
    return data;
  },
  updateNeighborhood: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.put(`/neighborhoods/${id}`, payload);
    return data;
  }
};
