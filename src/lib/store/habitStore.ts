import { create } from 'zustand';
import { formatDate, getWeekDates, getWeekStart, shiftDate } from '@/lib/calendar';
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

export const HABIT_WEEK_PAGE_SIZE = 4;

export function getHabitWeekDays(from = new Date(), firstDayOfWeek: 0 | 1 = 1): Date[] {
  return getWeekDates(getWeekStart(from, firstDayOfWeek));
}

export function listHabitWeeks(from = new Date(), count = HABIT_WEEK_PAGE_SIZE, firstDayOfWeek: 0 | 1 = 1): Date[][] {
  const currentStart = getWeekStart(from, firstDayOfWeek);
  const weeks: Date[][] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    weeks.push(getWeekDates(shiftDate(currentStart, -i * 7)));
  }
  return weeks;
}

export function shiftHabitWeekPage(
  from = new Date(),
  pages: number,
  firstDayOfWeek: 0 | 1 = 1,
  pageSize = HABIT_WEEK_PAGE_SIZE,
): Date {
  return shiftDate(getWeekStart(from, firstDayOfWeek), pages * pageSize * 7);
}

export function clampHabitWeekPageEnd(end: Date, today = new Date(), firstDayOfWeek: 0 | 1 = 1): Date {
  const endStart = getWeekStart(end, firstDayOfWeek);
  const todayStart = getWeekStart(today, firstDayOfWeek);
  return formatDate(endStart) >= formatDate(todayStart) ? todayStart : endStart;
}

export function formatHabitWeeksInterval(weeks: Date[][]): string {
  const start = weeks[0]?.[0];
  const lastWeek = weeks[weeks.length - 1];
  const end = lastWeek?.[lastWeek.length - 1];
  if (!start || !end) return '';
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatHabitWeekRange(weekDays: Date[]): string {
  const start = weekDays[0];
  const end = weekDays[weekDays.length - 1];
  if (!start || !end) return '';
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    ? String(end.getDate())
    : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export function isSameHabitWeek(a: Date, b: Date, firstDayOfWeek: 0 | 1 = 1): boolean {
  return formatDate(getWeekStart(a, firstDayOfWeek)) === formatDate(getWeekStart(b, firstDayOfWeek));
}

export function habitCreatedDateKey(habit: Pick<Habit, 'createdAt'>): string | null {
  if (!habit.createdAt) return null;
  const created = new Date(habit.createdAt);
  if (Number.isNaN(created.getTime())) return null;
  return formatDate(created);
}

export function isHabitTrackableOn(habit: Pick<Habit, 'createdAt'>, date: Date): boolean {
  const createdKey = habitCreatedDateKey(habit);
  if (!createdKey) return true;
  return formatDate(date) >= createdKey;
}

export function habitExistsInWeek(habit: Pick<Habit, 'createdAt'>, weekDays: Date[]): boolean {
  const weekEnd = weekDays[weekDays.length - 1];
  if (!weekEnd) return true;
  return isHabitTrackableOn(habit, weekEnd);
}

export function habitsForWeek<T extends Pick<Habit, 'createdAt'>>(habits: T[], weekDays: Date[]): T[] {
  return habits.filter((habit) => habitExistsInWeek(habit, weekDays));
}

export function habitTrackableDays<T extends Pick<Habit, 'createdAt'>>(habit: T, weekDays: Date[]): Date[] {
  return weekDays.filter((day) => isHabitTrackableOn(habit, day));
}

export function habitProgress(habit: Habit, weekDays: Date[]): { done: number; total: number } {
  const days = habitTrackableDays(habit, weekDays);
  const done = days.filter((day) => habit.completions[formatDate(day)]).length;
  return { done, total: days.length };
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
    if (!current || !isHabitTrackableOn(current, date)) return;
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
