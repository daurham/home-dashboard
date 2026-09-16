export type HomeModuleId =
  | 'stats'
  | 'expenses'
  | 'chores'
  | 'habits'
  | 'calendar'
  | 'latency'
  | 'cameras';

export type HomeModuleRole = 'banner' | 'tile';
export type HomeModuleScale = 'full' | 'compact' | 'wide';

export interface HomeModuleMeta {
  id: HomeModuleId;
  title: string;
  role: HomeModuleRole;
  canResize: boolean;
  canWiden: boolean;
}

export const HOME_MODULES: Record<HomeModuleId, HomeModuleMeta> = {
  stats: { id: 'stats', title: 'Overview', role: 'banner', canResize: true, canWiden: false },
  expenses: { id: 'expenses', title: 'Expense Logger', role: 'tile', canResize: true, canWiden: false },
  chores: { id: 'chores', title: 'Recurring Chores', role: 'tile', canResize: true, canWiden: false },
  habits: { id: 'habits', title: 'Habit Tracker', role: 'tile', canResize: true, canWiden: false },
  calendar: { id: 'calendar', title: 'Calendar', role: 'tile', canResize: true, canWiden: true },
  latency: { id: 'latency', title: 'Latency Tracker', role: 'tile', canResize: true, canWiden: false },
  cameras: { id: 'cameras', title: 'Cameras', role: 'tile', canResize: false, canWiden: false },
};

export const DEFAULT_HOME_ORDER: HomeModuleId[] = [
  'stats',
  'expenses',
  'chores',
  'habits',
  'calendar',
  'latency',
  'cameras',
];

export const DEFAULT_HOME_SCALES: Record<HomeModuleId, HomeModuleScale> = {
  stats: 'full',
  expenses: 'full',
  chores: 'full',
  habits: 'full',
  calendar: 'full',
  latency: 'full',
  cameras: 'full',
};

const ALL_IDS = new Set<HomeModuleId>(DEFAULT_HOME_ORDER);

export function normalizeHomeOrder(order: HomeModuleId[] | undefined): HomeModuleId[] {
  const seen = new Set<HomeModuleId>();
  const next: HomeModuleId[] = [];
  for (const id of order ?? []) {
    if (!ALL_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  for (const id of DEFAULT_HOME_ORDER) {
    if (!seen.has(id)) next.push(id);
  }
  return next;
}

export function normalizeHomeScales(
  scales: Partial<Record<HomeModuleId, HomeModuleScale>> | undefined,
): Record<HomeModuleId, HomeModuleScale> {
  const next = { ...DEFAULT_HOME_SCALES };
  for (const id of DEFAULT_HOME_ORDER) {
    if (!HOME_MODULES[id].canResize) {
      next[id] = 'full';
      continue;
    }
    if (scales?.[id] === 'compact') next[id] = 'compact';
    if (scales?.[id] === 'wide' && HOME_MODULES[id].canWiden) next[id] = 'wide';
  }
  return next;
}

/** Sortable list move: insert before target, or after if moving forward. */
export function moveItem<T>(list: T[], fromItem: T, toItem: T): T[] {
  if (fromItem === toItem) return list;
  const from = list.indexOf(fromItem);
  const to = list.indexOf(toItem);
  if (from < 0 || to < 0) return list;
  const next = list.filter((_, index) => index !== from);
  const insertAt = from < to ? next.indexOf(toItem) + 1 : next.indexOf(toItem);
  next.splice(insertAt, 0, fromItem);
  return next;
}

export interface HomePlacement {
  id: HomeModuleId;
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
}

export function moduleRowSpan(id: HomeModuleId, scale: HomeModuleScale): number {
  if (HOME_MODULES[id].role === 'banner') return 1;
  if (!HOME_MODULES[id].canResize) return 2;
  if (scale === 'compact') return 1;
  if (scale === 'wide') return 3;
  return 2;
}

export function moduleColumnSpan(id: HomeModuleId, scale: HomeModuleScale, columns: number): number {
  const cols = Math.max(1, columns);
  if (HOME_MODULES[id].role === 'banner') return cols;
  if (scale === 'wide' && HOME_MODULES[id].canWiden) return Math.min(2, cols);
  return 1;
}

export function packHomeLayout(
  order: HomeModuleId[],
  scales: Record<HomeModuleId, HomeModuleScale>,
  columns: number,
): { placements: HomePlacement[]; rowCount: number } {
  const cols = Math.max(1, columns);
  const occupied: boolean[][] = [];

  const ensureRows = (count: number) => {
    while (occupied.length < count) {
      occupied.push(Array.from({ length: cols }, () => false));
    }
  };

  const fits = (row: number, col: number, rowSpan: number, colSpan: number) => {
    if (col < 0 || col + colSpan > cols) return false;
    ensureRows(row + rowSpan);
    for (let r = row; r < row + rowSpan; r += 1) {
      for (let c = col; c < col + colSpan; c += 1) {
        if (occupied[r][c]) return false;
      }
    }
    return true;
  };

  const occupy = (row: number, col: number, rowSpan: number, colSpan: number) => {
    ensureRows(row + rowSpan);
    for (let r = row; r < row + rowSpan; r += 1) {
      for (let c = col; c < col + colSpan; c += 1) {
        occupied[r][c] = true;
      }
    }
  };

  const placements: HomePlacement[] = [];

  for (const id of order) {
    const columnSpan = moduleColumnSpan(id, scales[id] ?? 'full', cols);
    const rowSpan = moduleRowSpan(id, scales[id] ?? 'full');
    let placed = false;

    for (let row = 0; row < 80 && !placed; row += 1) {
      for (let col = 0; col <= cols - columnSpan; col += 1) {
        if (!fits(row, col, rowSpan, columnSpan)) continue;
        occupy(row, col, rowSpan, columnSpan);
        placements.push({
          id,
          column: col + 1,
          row: row + 1,
          columnSpan,
          rowSpan,
        });
        placed = true;
        break;
      }
    }
  }

  return { placements, rowCount: Math.max(1, occupied.length) };
}

export function homeGridTemplateRows(placements: HomePlacement[], rowCount: number): string {
  const rows = Array.from({ length: rowCount }, () => 'minmax(0,1fr)');
  for (const placement of placements) {
    if (HOME_MODULES[placement.id].role !== 'banner') continue;
    for (let offset = 0; offset < placement.rowSpan; offset += 1) {
      rows[placement.row - 1 + offset] = 'auto';
    }
  }
  return rows.join(' ');
}
