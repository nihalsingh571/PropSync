import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

// ── PropSync Role Types ────────────────────────────────────────────────────────
export type PropSyncRole = 'admin' | 'property_owner' | 'tenant' | 'maintenance_staff';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  roles: PropSyncRole[];
  isAdmin: boolean;
  twoFactorEnabled?: boolean;
}

// ── Role Helpers (used across the app) ────────────────────────────────────────
export const isAdmin = (user: User | null): boolean =>
  Boolean(user?.roles?.includes('admin') || user?.isAdmin);

export const isPropertyOwner = (user: User | null): boolean =>
  Boolean(user?.roles?.includes('property_owner'));

export const isTenant = (user: User | null): boolean =>
  Boolean(user?.roles?.includes('tenant'));

export const isMaintenanceStaff = (user: User | null): boolean =>
  Boolean(user?.roles?.includes('maintenance_staff'));

export const getPrimaryRole = (user: User | null): PropSyncRole | null => {
  if (!user?.roles?.length) return null;
  const priority: PropSyncRole[] = ['admin', 'property_owner', 'maintenance_staff', 'tenant'];
  return priority.find(r => user.roles.includes(r)) ?? user.roles[0];
};

export const getRoleLabel = (role: PropSyncRole | null): string => {
  const labels: Record<PropSyncRole, string> = {
    admin: 'Admin',
    property_owner: 'Property Owner',
    tenant: 'Tenant',
    maintenance_staff: 'Maintenance Staff'
  };
  return role ? labels[role] : 'User';
};

// ── Context Shape ─────────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: PropSyncRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ require2FA?: boolean; tempToken?: string } | void>;
  verify2FA: (code: string, tempToken: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Normalise raw API response into a typed User ───────────────────────────────
const VALID_ROLES: PropSyncRole[] = ['admin', 'property_owner', 'tenant', 'maintenance_staff'];

const normalizeUser = (data: any): User => {
  let roles: PropSyncRole[] = [];

  if (Array.isArray(data.roles)) {
    roles = data.roles.filter((r: string) => VALID_ROLES.includes(r as PropSyncRole)) as PropSyncRole[];
  }

  // Backward-compat: if isAdmin flag set and no admin role, add it
  if ((data.isAdmin === true) && !roles.includes('admin')) {
    roles = ['admin', ...roles];
  }

  // Default fallback
  if (roles.length === 0) roles = ['tenant'];

  return {
    _id: data._id,
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? null,
    profileImage: data.profileImage ?? null,
    roles,
    isAdmin: roles.includes('admin'),
    twoFactorEnabled: data.twoFactorEnabled ?? false
  };
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const normalized = normalizeUser(parsed);
        setToken(storedToken);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const persist = (newToken: string, userData: any) => {
    const normalized = normalizeUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalized));
    setToken(newToken);
    setUser(normalized);
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<{ require2FA?: boolean; tempToken?: string } | void> => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.require2FA) {
        return { require2FA: true, tempToken: data.tempToken };
      }
      const { token: newToken, ...userData } = data;
      persist(newToken, userData);
    } catch (error: any) {
      const msg = error.response?.data?.message ?? 'Login failed. Please try again.';
      throw new Error(msg);
    }
  };

  // ── Verify 2FA ──────────────────────────────────────────────────────────────
  const verify2FA = async (code: string, tempToken: string): Promise<void> => {
    try {
      const { data } = await api.post('/auth/verify-2fa', { code, tempToken });
      const { token: newToken, ...userData } = data;
      persist(newToken, userData);
    } catch (error: any) {
      const msg = error.response?.data?.message ?? 'Verification failed.';
      throw new Error(msg);
    }
  };

  // ── Register ────────────────────────────────────────────────────────────────
  const register = async (payload: RegisterPayload): Promise<void> => {
    try {
      const { data } = await api.post('/auth/register', payload);
      const { token: newToken, ...userData } = data;
      persist(newToken, userData);
    } catch (error: any) {
      const serverMsg = error.response?.data?.message ?? '';
      let message = 'Registration failed. Please try again.';
      if (serverMsg.includes('already exists')) {
        message = 'An account with this email already exists. Please sign in.';
      } else if (serverMsg) {
        message = serverMsg;
      }
      throw new Error(message);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback((): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // ── Optimistic local update (e.g. after profile edit) ──────────────────────
  const updateUser = useCallback((updates: Partial<User>): void => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, token, login, verify2FA, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export { api };
