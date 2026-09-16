import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_EXPENSE_TIMEZONE } from '@/lib/expenses/weekRange';

export type TimeFormat = '12-hour' | '24-hour';
export type Units = 'metric' | 'imperial';

export const DEFAULT_HOUSEHOLD_LABEL = 'Daurham Household';
export const DEFAULT_HOUSEHOLD_MEMBERS = ['Jake', 'Bo'];
const LEGACY_HOUSEHOLD_LABELS = new Set(['Jake & household', 'Jake & Wife']);
const LEGACY_HOUSEHOLD_MEMBERS = ['Jake', 'Wife'];

function sameMembers(a: string[] | undefined, b: string[]): boolean {
  if (!a || a.length !== b.length) return false;
  return a.every((name, index) => name === b[index]);
}

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
      householdLabel: DEFAULT_HOUSEHOLD_LABEL,
      householdMembers: DEFAULT_HOUSEHOLD_MEMBERS,
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
        const persistedLabel = persisted?.householdLabel?.trim();
        const persistedMembers = persisted?.householdMembers;
        return {
          ...currentState,
          ...persisted,
          expenseTimeZone:
            !persisted?.expenseTimeZone || persisted.expenseTimeZone === 'America/Los_Angeles'
              ? DEFAULT_EXPENSE_TIMEZONE
              : persisted.expenseTimeZone,
          greetingName: persisted?.greetingName || 'Jake',
          householdLabel:
            !persistedLabel || LEGACY_HOUSEHOLD_LABELS.has(persistedLabel)
              ? DEFAULT_HOUSEHOLD_LABEL
              : persistedLabel,
          householdMembers:
            !persistedMembers?.length || sameMembers(persistedMembers, LEGACY_HOUSEHOLD_MEMBERS)
              ? DEFAULT_HOUSEHOLD_MEMBERS
              : persistedMembers,
        };
      },
    }
  )
);
