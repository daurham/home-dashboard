import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_DARK_ENDS_AT, DEFAULT_DARK_STARTS_AT } from '@/lib/theme/schedule';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'teal' | 'blue' | 'green' | 'orange' | 'purple';

interface ThemeState {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  darkStartsAt: string;
  darkEndsAt: string;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setDarkSchedule: (startsAt: string, endsAt: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'auto',
      accentColor: 'teal',
      darkStartsAt: DEFAULT_DARK_STARTS_AT,
      darkEndsAt: DEFAULT_DARK_ENDS_AT,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      setDarkSchedule: (darkStartsAt, darkEndsAt) => set({ darkStartsAt, darkEndsAt }),
    }),
    {
      name: 'theme-storage',
      version: 2,
      migrate: (persistedState, version) => {
        const persisted = persistedState as Partial<ThemeState>;
        if (version < 2) {
          return {
            ...persisted,
            themeMode: persisted.themeMode === 'dark' ? 'dark' : 'auto',
            darkStartsAt: persisted.darkStartsAt || DEFAULT_DARK_STARTS_AT,
            darkEndsAt: persisted.darkEndsAt || DEFAULT_DARK_ENDS_AT,
          };
        }
        return persisted;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ThemeState> | undefined;
        return {
          ...currentState,
          ...persisted,
          themeMode: persisted?.themeMode ?? 'auto',
          darkStartsAt: persisted?.darkStartsAt || DEFAULT_DARK_STARTS_AT,
          darkEndsAt: persisted?.darkEndsAt || DEFAULT_DARK_ENDS_AT,
        };
      },
    }
  )
);
