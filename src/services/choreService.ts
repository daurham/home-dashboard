import { choresApi, type DbChore } from '@/services/apiService';
import {
  CHORE_STORAGE_KEY,
  clearBrowserBackup,
  looksLikeSeedChores,
  readZustandState,
} from '@/lib/store/browserBackup';
import { CHORE_ICON_IDS, type ChoreIconId } from '@/lib/chores/iconIds';
import type { Chore, ChoreIntervalUnit } from '@/lib/store/choreStore';

const ICONS: ChoreIconId[] = [...CHORE_ICON_IDS];

function fromApi(row: DbChore): Chore {
  const unit: ChoreIntervalUnit =
    row.unit === 'days' || row.unit === 'weeks' || row.unit === 'months' ? row.unit : 'weeks';
  return {
    id: row.id,
    title: row.title,
    assignee: row.assignee || '',
    every: row.every,
    unit,
    weekday: row.weekday,
    monthDay: row.monthDay,
    icon: ICONS.includes(row.icon as ChoreIconId) ? (row.icon as ChoreIconId) : 'generic',
    daySpecific: Boolean(row.daySpecific),
    lastCompletedOn: row.lastCompletedOn,
    completedOccurrences: row.completedOccurrences || {},
    createdAt: row.createdAt,
  };
}

export async function listChores(): Promise<Chore[]> {
  const rows = await choresApi.list();
  return rows.map(fromApi);
}

export async function createChore(chore: Omit<Chore, 'id'> & { id?: string }): Promise<Chore> {
  return fromApi(await choresApi.create(chore));
}

export async function updateChore(id: string, chore: Chore): Promise<Chore> {
  return fromApi(await choresApi.update(id, chore));
}

export async function deleteChore(id: string): Promise<void> {
  await choresApi.delete(id);
}

function readLocalChores(): Chore[] {
  const state = readZustandState<{ chores?: Array<Partial<Chore> & { id?: string; title?: string }> }>(CHORE_STORAGE_KEY);
  if (!Array.isArray(state?.chores)) return [];
  return state.chores.flatMap((raw) => {
    if (!raw?.id || !raw.title) return [];
    const unit: ChoreIntervalUnit =
      raw.unit === 'days' || raw.unit === 'weeks' || raw.unit === 'months' ? raw.unit : 'weeks';
    return [{
      id: raw.id,
      title: raw.title,
      assignee: raw.assignee || '',
      every: raw.every ?? 1,
      unit,
      weekday: raw.weekday ?? 0,
      monthDay: raw.monthDay ?? 1,
      icon: ICONS.includes(raw.icon as ChoreIconId) ? (raw.icon as ChoreIconId) : 'generic',
      daySpecific: typeof raw.daySpecific === 'boolean' ? raw.daySpecific : unit !== 'days',
      lastCompletedOn: raw.lastCompletedOn ?? null,
      completedOccurrences: raw.completedOccurrences || {},
      createdAt: raw.createdAt || new Date().toISOString(),
    }];
  });
}

/** Empty database + a real browser copy → lift that copy once. */
export async function loadChores(): Promise<Chore[]> {
  let chores = await listChores();
  if (chores.length === 0) {
    const local = readLocalChores();
    if (local.length > 0 && !looksLikeSeedChores(local)) {
      chores = (await choresApi.importAll(local)).map(fromApi);
    }
  }
  clearBrowserBackup(CHORE_STORAGE_KEY);
  return chores;
}
