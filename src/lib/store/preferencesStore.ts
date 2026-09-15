import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_EXPENSE_TIMEZONE } from '@/lib/expenses/weekRange';

export type TimeFormat = '12-hour' | '24-hour';
export type Units = 'metric' | 'imperial';

interface PreferencesState {
  timeFormat: TimeFormat;
  units: Units;
  expenseTimeZone: string;
  setTimeFormat: (format: TimeFormat) => void;
  setUnits: (units: Units) => void;
  setExpenseTimeZone: (timeZone: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      timeFormat: '12-hour',
      units: 'imperial',
      expenseTimeZone: DEFAULT_EXPENSE_TIMEZONE,
      setTimeFormat: (format) => set({ timeFormat: format }),
      setUnits: (units) => set({ units }),
      setExpenseTimeZone: (expenseTimeZone) => set({ expenseTimeZone }),
    }),
    {
      name: 'preferences-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PreferencesState> | undefined;
        return {
          ...currentState,
          ...persisted,
          expenseTimeZone: persisted?.expenseTimeZone || DEFAULT_EXPENSE_TIMEZONE,
        };
      },
    }
  )
);

