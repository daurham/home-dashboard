import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'teal' | 'blue' | 'green' | 'orange' | 'purple';

interface ThemeState {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      accentColor: 'teal',
      setThemeMode: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

