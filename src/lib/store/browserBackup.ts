export const CHORE_STORAGE_KEY = 'chore-storage';
export const HABIT_STORAGE_KEY = 'habit-storage';

const SEED_CHORE_TITLES = ['Clean bathrooms', 'Take bins out', 'Vacuum upstairs', 'Water plants'];
const SEED_HABIT_NAMES = ['Drink 2L water', 'Meditate', 'No screens after 9pm', 'Workout'];

export function readZustandState<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: T };
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

export function clearBrowserBackup(key: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(key);
}

function daysBetweenIso(from: string, to: string): number {
  const a = Date.parse(`${from.slice(0, 10)}T00:00:00`);
  const b = Date.parse(`${to.slice(0, 10)}T00:00:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.round((b - a) / 86_400_000);
}

/**
 * The first-visit demo list. Importing it from a phone that never customized
 * chores would overwrite an empty database and hide the desktop's real list.
 */
export function looksLikeSeedChores(
  chores: Array<{
    title: string;
    lastCompletedOn: string | null;
    completedOccurrences: Record<string, string>;
    createdAt: string;
  }>,
): boolean {
  if (chores.length !== SEED_CHORE_TITLES.length) return false;
  const titles = [...chores.map((chore) => chore.title)].sort();
  if (titles.join('|') !== SEED_CHORE_TITLES.join('|')) return false;

  return chores.every((chore) => {
    const created = chore.createdAt.slice(0, 10);
    if (chore.lastCompletedOn && Math.abs(daysBetweenIso(created, chore.lastCompletedOn)) > 1) {
      return false;
    }
    return Object.keys(chore.completedOccurrences).length <= 1;
  });
}

export function looksLikeSeedHabits(
  habits: Array<{ name: string; completions: Record<string, boolean>; createdAt: string }>,
): boolean {
  if (habits.length !== SEED_HABIT_NAMES.length) return false;
  const names = [...habits.map((habit) => habit.name)].sort();
  if (names.join('|') !== SEED_HABIT_NAMES.join('|')) return false;

  return habits.every((habit) => {
    const created = habit.createdAt.slice(0, 10);
    return Object.keys(habit.completions).every((date) => Math.abs(daysBetweenIso(created, date)) <= 8);
  });
}
