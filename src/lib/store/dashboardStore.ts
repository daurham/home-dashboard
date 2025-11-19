import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultDashboardConfig, DashboardConfig, CalendarConfig } from '@/config/dashboard';

interface DashboardState {
  config: DashboardConfig;
  updateCalendarConfig: (updates: Partial<CalendarConfig>) => void;
  updateConfig: (updates: Partial<DashboardConfig>) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      config: defaultDashboardConfig,
      updateCalendarConfig: (updates) => set((state) => ({
        config: {
          ...state.config,
          calendar: { ...state.config.calendar, ...updates }
        }
      })),
      updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates }
      })),
    }),
    {
      name: 'dashboard-storage',
    }
  )
);

