import { create } from 'zustand';

export type AdminDateRange = '7d' | '30d' | '90d';

interface AdminState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  dateRange: AdminDateRange;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setDateRange: (range: AdminDateRange) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  theme: 'light',
  sidebarCollapsed: false,
  dateRange: '30d',
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setDateRange: (range) => set({ dateRange: range })
}));
