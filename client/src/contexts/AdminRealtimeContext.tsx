import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export interface AdminRealtimeEvent {
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface AdminRealtimeContextValue {
  socket: Socket | null;
  events: AdminRealtimeEvent[];
  liveUserCount: number | null;
}

const AdminRealtimeContext = createContext<AdminRealtimeContextValue>({
  socket: null,
  events: [],
  liveUserCount: null
});

const getSocketBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_URL;
  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

export const AdminRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [events, setEvents] = useState<AdminRealtimeEvent[]>([]);
  const [liveUserCount, setLiveUserCount] = useState<number | null>(null);

  const invalidateForEvent = useCallback((event: string) => {
    const invalidate = (key: unknown[]) =>
      queryClient.invalidateQueries({ queryKey: key });
    switch (event) {
      case 'new_user_registered':
        invalidate(['admin-dashboard']);
        invalidate(['admin-user-analytics']);
        invalidate(['admin-users']);
        break;
      case 'property_updated':
        invalidate(['admin-dashboard']);
        invalidate(['admin-property-analytics']);
        invalidate(['admin-properties']);
        break;
      case 'admin_action_performed':
        invalidate(['admin-dashboard']);
        invalidate(['admin-activity-log']);
        invalidate(['admin-users']);
        break;
      case 'dashboard:stats_updated':
        invalidate(['admin-dashboard']);
        break;
      default:
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    // Connect socket only for admin users
    const isAdminUser = user?.roles?.includes('admin') || user?.isAdmin;
    if (!isAdminUser) {
      setSocket(null);
      setEvents([]);
      setLiveUserCount(null);
      return;
    }

    const baseUrl = getSocketBaseUrl();
    const instance = io(`${baseUrl}/admin`, {
      withCredentials: true
    });
    setSocket(instance);

    instance.onAny((event, payload = {}) => {
      const timestamp = typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString();
      setEvents((prev) => [
        { event, payload, timestamp },
        ...prev
      ].slice(0, 50));
      if (event === 'live_user_count' && typeof payload.count === 'number') {
        setLiveUserCount(payload.count);
      } else {
        invalidateForEvent(event);
      }
    });

    return () => {
      instance.disconnect();
    };
  }, [user?.isAdmin, user?.roles, invalidateForEvent]);

  const value = useMemo(() => ({ socket, events, liveUserCount }), [socket, events, liveUserCount]);

  return (
    <AdminRealtimeContext.Provider value={value}>
      {children}
    </AdminRealtimeContext.Provider>
  );
};

export const useAdminRealtime = () => useContext(AdminRealtimeContext);
