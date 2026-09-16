import { create } from 'zustand';
import { formatDate, getWeekDates, getWeekStart } from '@/lib/calendar';
import * as habitService from '@/services/habitService';

export interface Habit {
  id: string;
  name: string;
  completions: Record<string, boolean>;
  createdAt: string;
}

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  hasLoaded: boolean;
  load: () => Promise<void>;
  addHabit: (name: string) => Promise<Habit>;
  updateHabit: (id: string, name: string) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleDay: (id: string, date: Date) => Promise<void>;
}

export function getHabitWeekDays(from = new Date(), firstDayOfWeek: 0 | 1 = 0): Date[] {
  return getWeekDates(getWeekStart(from, firstDayOfWeek));
}

export function habitProgress(habit: Habit, weekDays: Date[]): { done: number; total: number } {
  const done = weekDays.filter((day) => habit.completions[formatDate(day)]).length;
  return { done, total: weekDays.length };
}

export function isHabitCompleteOn(habit: Habit, date: Date): boolean {
  return Boolean(habit.completions[formatDate(date)]);
}

function applyToggleDay(habit: Habit, date: Date): Habit {
  const key = formatDate(date);
  const completions = { ...habit.completions };
  if (completions[key]) delete completions[key];
  else completions[key] = true;
  return { ...habit, completions };
}

export const useHabitStore = create<HabitState>()((set, get) => ({
  habits: [],
  isLoading: false,
  hasLoaded: false,

  load: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const habits = await habitService.loadHabits();
      set({ habits, isLoading: false, hasLoaded: true });
    } catch (error) {
      console.error('Error loading habits:', error);
      set({ isLoading: false, hasLoaded: true });
    }
  },

  addHabit: async (name) => {
    const created = await habitService.createHabit({
      name: name.trim(),
      completions: {},
      createdAt: new Date().toISOString(),
    });
    set({ habits: [...get().habits, created] });
    return created;
  },

  updateHabit: async (id, name) => {
    const current = get().habits.find((habit) => habit.id === id);
    if (!current) return;
    const saved = await habitService.updateHabit(id, { ...current, name: name.trim() });
    set({ habits: get().habits.map((habit) => (habit.id === id ? saved : habit)) });
  },

  removeHabit: async (id) => {
    await habitService.deleteHabit(id);
    set({ habits: get().habits.filter((habit) => habit.id !== id) });
  },

  toggleDay: async (id, date) => {
    const current = get().habits.find((habit) => habit.id === id);
    if (!current) return;
    const next = applyToggleDay(current, date);
    set({ habits: get().habits.map((habit) => (habit.id === id ? next : habit)) });
    try {
      const saved = await habitService.updateHabit(id, next);
      set({ habits: get().habits.map((habit) => (habit.id === id ? saved : habit)) });
    } catch (error) {
      console.error('Error toggling habit:', error);
      set({ habits: get().habits.map((habit) => (habit.id === id ? current : habit)) });
    }
  },
}));
