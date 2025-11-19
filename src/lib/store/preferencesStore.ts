import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimeFormat = '12-hour' | '24-hour';
export type Units = 'metric' | 'imperial';

interface PreferencesState {
  timeFormat: TimeFormat;
  units: Units;
  setTimeFormat: (format: TimeFormat) => void;
  setUnits: (units: Units) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      timeFormat: '12-hour',
      units: 'metric',
      setTimeFormat: (format) => set({ timeFormat: format }),
      setUnits: (units) => set({ units }),
    }),
    {
      name: 'preferences-storage',
    }
  )
);

