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
  demographics: {
    familyStatus: Array<{ _id: string; count: number }>;
    ageBuckets: Array<{ _id: string; count: number }>;
  };
}

export interface NeighborhoodAnalyticsResponse {
  cityDistribution: Array<{ _id: string; count: number; avgRating: number }>;
  topRated: Array<{
    _id: string;
    name: string;
    city: string;
    overallRating: number;
    matchSuccessRate?: number;
    sentimentScore?: number;
  }>;
  popularityTrend: Array<{ _id: string; avgMatch: number; avgSentiment: number }>;
  viewTrend: Array<{ _id: string; avgViews: number; avgMatch: number }>;
  matchSuccessDistribution: Array<{ _id: string; count: number }>;
  comparison: Array<{ _id: string; avgMatch: number; avgSentiment: number; totalViews: number; neighborhoods: number }>;
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
  getDashboardStats: async (range: string) => {
    const { data } = await api.get<DashboardStatsResponse>('/admin/dashboard-stats', {
      params: { range }
    });
    return data;
  },
  getSystemHealth: async () => {
    const { data } = await api.get<SystemHealthResponse>('/admin/system-health');
    return data;
  },
  triggerBackup: async () => {
    const { data } = await api.post<{ jobId: string; status: string }>('/admin/backup');
    return data;
  },
  getUserAnalytics: async (range: string) => {
    const { data } = await api.get<UserAnalyticsResponse>('/admin/user-analytics', {
      params: { range }
    });
    return data;
  },
  getNeighborhoodAnalytics: async (range: string) => {
    const { data } = await api.get<NeighborhoodAnalyticsResponse>('/admin/neighborhood-analytics', {
      params: { range }
    });
    return data;
  },
  getUsers: async () => {
    const { data } = await api.get<AdminUser[]>('/auth/users');
    return data;
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
