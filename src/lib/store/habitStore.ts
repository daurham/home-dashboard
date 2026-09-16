import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils/uuid';
import { formatDate, getWeekDates, getWeekStart } from '@/lib/calendar';

export interface Habit {
  id: string;
  name: string;
  completions: Record<string, boolean>;
  createdAt: string;
}

interface HabitState {
  habits: Habit[];
  addHabit: (name: string) => Habit;
  updateHabit: (id: string, name: string) => void;
  removeHabit: (id: string) => void;
  toggleDay: (id: string, date: Date) => void;
}

const defaultHabits = (): Habit[] => {
  const now = new Date().toISOString();
  const weekStart = getWeekStart(new Date(), 0);
  const days = getWeekDates(weekStart);

  const stamped = (pattern: boolean[]): Record<string, boolean> => {
    const completions: Record<string, boolean> = {};
    days.forEach((day, index) => {
      if (pattern[index]) completions[formatDate(day)] = true;
    });
    return completions;
  };

  return [
    {
      id: generateUUID(),
      name: 'Drink 2L water',
      completions: stamped([true, true, true, true, true, true, false]),
      createdAt: now,
    },
    {
      id: generateUUID(),
      name: 'Workout',
      completions: stamped([true, true, false, false, true, true, false]),
      createdAt: now,
    },
    {
      id: generateUUID(),
      name: 'No screens after 9pm',
      completions: stamped([true, true, true, true, true, true, false]),
      createdAt: now,
    },
    {
      id: generateUUID(),
      name: 'Meditate',
      completions: stamped([true, true, true, false, false, false, false]),
      createdAt: now,
    },
  ];
};

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

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: defaultHabits(),
      addHabit: (name) => {
        const habit: Habit = {
          id: generateUUID(),
          name: name.trim(),
          completions: {},
          createdAt: new Date().toISOString(),
        };
        set({ habits: [...get().habits, habit] });
        return habit;
      },
      updateHabit: (id, name) => {
        set({
          habits: get().habits.map((habit) => (habit.id === id ? { ...habit, name: name.trim() } : habit)),
        });
      },
      removeHabit: (id) => {
        set({ habits: get().habits.filter((habit) => habit.id !== id) });
      },
      toggleDay: (id, date) => {
        const key = formatDate(date);
        set({
          habits: get().habits.map((habit) => {
            if (habit.id !== id) return habit;
            const completions = { ...habit.completions };
            if (completions[key]) {
              delete completions[key];
            } else {
              completions[key] = true;
            }
            return { ...habit, completions };
          }),
        });
      },
    }),
    { name: 'habit-storage' },
  ),
);
