import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultDashboardConfig, DashboardConfig, CalendarConfig } from '@/config/dashboard';
import type { SidebarTab } from './uiStore';

interface DashboardState {
  config: DashboardConfig;
  updateCalendarConfig: (updates: Partial<CalendarConfig>) => void;
  updateConfig: (updates: Partial<DashboardConfig>) => void;
}

function withNewDefaultTabs(config: DashboardConfig): DashboardConfig {
  const visibleTabs = config.visibleTabs.includes('cameras')
    ? config.visibleTabs
    : [...config.visibleTabs, 'cameras' as SidebarTab];

  return {
    ...config,
    visibleTabs,
  };
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
      merge: (persistedState, currentState) => {
        const persisted = persistedState as DashboardState | undefined;
        if (!persisted) {
          return currentState;
        }

        return {
          ...currentState,
          ...persisted,
          config: withNewDefaultTabs({
            ...currentState.config,
            ...persisted.config,
          }),
        };
      },
    }
  )
);

