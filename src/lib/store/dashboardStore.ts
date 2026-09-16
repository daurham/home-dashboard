import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultDashboardConfig, DashboardConfig, CalendarConfig, WeatherConfig } from '@/config/dashboard';
import { resolveWeatherLocation } from '@/config/weatherLocation';
import type { SidebarTab } from './uiStore';

interface DashboardState {
  config: DashboardConfig;
  updateCalendarConfig: (updates: Partial<CalendarConfig>) => void;
  updateWeatherConfig: (updates: Partial<WeatherConfig>) => void;
  updateConfig: (updates: Partial<DashboardConfig>) => void;
}

function withNewDefaultTabs(config: DashboardConfig): DashboardConfig {
  const extras: SidebarTab[] = ['home', 'chores', 'habits', 'cameras', 'expenses', 'latency', 'files', 'logs', 'savings'];
  const visibleTabs = [...config.visibleTabs];
  for (const tab of extras) {
    if (!visibleTabs.includes(tab)) visibleTabs.push(tab);
  }

  const location = resolveWeatherLocation(config.weather);

  return {
    ...config,
    defaultTab: config.defaultTab === 'calendar' ? 'home' : config.defaultTab,
    visibleTabs,
    weather: {
      ...defaultDashboardConfig.weather,
      ...config.weather,
      ...location,
    },
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
      updateWeatherConfig: (updates) => set((state) => ({
        config: {
          ...state.config,
          weather: { ...state.config.weather, ...updates }
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

