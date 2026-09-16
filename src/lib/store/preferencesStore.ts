import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_EXPENSE_TIMEZONE } from '@/lib/expenses/weekRange';

export type TimeFormat = '12-hour' | '24-hour';
export type Units = 'metric' | 'imperial';

interface PreferencesState {
  timeFormat: TimeFormat;
  units: Units;
  expenseTimeZone: string;
  greetingName: string;
  householdLabel: string;
  householdMembers: string[];
  setTimeFormat: (format: TimeFormat) => void;
  setUnits: (units: Units) => void;
  setExpenseTimeZone: (timeZone: string) => void;
  setGreetingName: (name: string) => void;
  setHouseholdLabel: (label: string) => void;
  setHouseholdMembers: (members: string[]) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      timeFormat: '12-hour',
      units: 'imperial',
      expenseTimeZone: DEFAULT_EXPENSE_TIMEZONE,
      greetingName: 'Jake',
      householdLabel: 'Daurham Household',
      householdMembers: ['Jake', 'Wife'],
      setTimeFormat: (format) => set({ timeFormat: format }),
      setUnits: (units) => set({ units }),
      setExpenseTimeZone: (expenseTimeZone) => set({ expenseTimeZone }),
      setGreetingName: (greetingName) => set({ greetingName }),
      setHouseholdLabel: (householdLabel) => set({ householdLabel }),
      setHouseholdMembers: (householdMembers) => set({ householdMembers }),
    }),
    {
      name: 'preferences-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PreferencesState> | undefined;
        return {
          ...currentState,
          ...persisted,
          expenseTimeZone:
            !persisted?.expenseTimeZone || persisted.expenseTimeZone === 'America/Los_Angeles'
              ? DEFAULT_EXPENSE_TIMEZONE
              : persisted.expenseTimeZone,
          greetingName: persisted?.greetingName || 'Jake',
          householdLabel: persisted?.householdLabel || 'Jake & household',
          householdMembers: persisted?.householdMembers?.length
            ? persisted.householdMembers
            : ['Jake', 'Wife'],
        };
      },
    }
  )
);

