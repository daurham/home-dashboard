import { habitsApi, type DbHabit } from '@/services/apiService';
import {
  HABIT_STORAGE_KEY,
  clearBrowserBackup,
  looksLikeSeedHabits,
  readZustandState,
} from '@/lib/store/browserBackup';
import type { Habit } from '@/lib/store/habitStore';

function fromApi(row: DbHabit): Habit {
  return {
    id: row.id,
    name: row.name,
    completions: row.completions && typeof row.completions === 'object' ? row.completions : {},
    createdAt: row.createdAt,
  };
}

export async function listHabits(): Promise<Habit[]> {
  const rows = await habitsApi.list();
  return rows.map(fromApi);
}

export async function createHabit(habit: Omit<Habit, 'id'> & { id?: string }): Promise<Habit> {
  return fromApi(await habitsApi.create(habit));
}

export async function updateHabit(id: string, habit: Habit): Promise<Habit> {
  return fromApi(await habitsApi.update(id, habit));
}

export async function deleteHabit(id: string): Promise<void> {
  await habitsApi.delete(id);
}

function readLocalHabits(): Habit[] {
  const state = readZustandState<{ habits?: Habit[] }>(HABIT_STORAGE_KEY);
  if (!Array.isArray(state?.habits)) return [];
  return state.habits.filter((habit) => habit && typeof habit.id === 'string' && typeof habit.name === 'string');
}

export async function loadHabits(): Promise<Habit[]> {
  let habits = await listHabits();
  if (habits.length === 0) {
    const local = readLocalHabits();
    if (local.length > 0 && !looksLikeSeedHabits(local)) {
      habits = (await habitsApi.importAll(local)).map(fromApi);
    }
  }
  clearBrowserBackup(HABIT_STORAGE_KEY);
  return habits;
}
