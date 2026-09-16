import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils/uuid';
import { formatDate, parseDate, shiftDate } from '@/lib/calendar';
import type { CalendarEvent } from '@/services/calendarService';

export type ChoreIntervalUnit = 'days' | 'weeks' | 'months';
export type ChoreIconId = 'bins' | 'vacuum' | 'bath' | 'plants' | 'laundry' | 'kitchen' | 'pets' | 'generic';

export interface Chore {
  id: string;
  title: string;
  assignee: string;
  every: number;
  unit: ChoreIntervalUnit;
  /** 0 = Sunday … 6 = Saturday. Used when unit is weeks and the chore is day specific. */
  weekday: number;
  /** 1–28. Used when unit is months and the chore is day specific. */
  monthDay: number;
  icon: ChoreIconId;
  /**
   * Day specific chores keep fixed calendar slots: completing one early clears that
   * occurrence and leaves the rest of the schedule untouched. Flexible chores float —
   * the next due date is measured from the day they were last completed.
   */
  daySpecific: boolean;
  lastCompletedOn: string | null;
  /** Occurrence date -> the day it was completed. Day specific chores only. */
  completedOccurrences: Record<string, string>;
  createdAt: string;
}

export type ChoreStatusTone = 'overdue' | 'today' | 'tomorrow' | 'done' | 'yesterday' | 'muted';

export interface ChoreStatus {
  label: string;
  tone: ChoreStatusTone;
  dueOn: string;
}

export interface ChoreDraft {
  title: string;
  assignee: string;
  every: number;
  unit: ChoreIntervalUnit;
  weekday: number;
  monthDay: number;
  icon: ChoreIconId;
  daySpecific: boolean;
}

interface ChoreState {
  chores: Chore[];
  addChore: (draft: ChoreDraft) => Chore;
  updateChore: (id: string, draft: Partial<ChoreDraft>) => void;
  removeChore: (id: string) => void;
  toggleComplete: (id: string, onDate?: Date) => void;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ICONS: ChoreIconId[] = ['bins', 'vacuum', 'bath', 'plants', 'laundry', 'kitchen', 'pets', 'generic'];

const DAY_MS = 86_400_000;
/** Completed occurrences older than this are dropped so storage stays bounded. */
const OCCURRENCE_HISTORY_DAYS = 400;
const WALK_GUARD = 400;

function isIcon(value: unknown): value is ChoreIconId {
  return typeof value === 'string' && ICONS.includes(value as ChoreIconId);
}

function clampEvery(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(365, Math.max(1, Math.round(n)));
}

function clampMonthDay(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(28, Math.max(1, Math.round(n)));
}

function clampWeekday(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return ((Math.round(n) % 7) + 7) % 7;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

function addMonthsOnDay(date: Date, months: number, dayOfMonth: number): Date {
  const base = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(clampMonthDay(dayOfMonth), last));
  return startOfDay(base);
}

function addMonthsKeepingDay(date: Date, months: number): Date {
  const base = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(date.getDate(), last));
  return startOfDay(base);
}

export function ordinal(n: number): string {
  const v = Math.abs(Math.round(n));
  const j = v % 10;
  const k = v % 100;
  if (j === 1 && k !== 11) return `${v}st`;
  if (j === 2 && k !== 12) return `${v}nd`;
  if (j === 3 && k !== 13) return `${v}rd`;
  return `${v}th`;
}

export function formatChoreInterval(
  chore: Pick<Chore, 'every' | 'unit' | 'weekday' | 'monthDay'> & { daySpecific?: boolean },
): string {
  const every = clampEvery(chore.every);
  if (chore.unit === 'days') {
    return every === 1 ? 'Every day' : `Every ${every} days`;
  }

  if (chore.unit === 'weeks') {
    if (!chore.daySpecific) {
      return every === 1 ? 'Every week' : `Every ${every} weeks`;
    }
    const weekday = WEEKDAYS[clampWeekday(chore.weekday)] ?? 'week';
    if (every === 1) return `Every ${weekday}`;
    if (every === 2) return `Every 2 weeks · ${weekday}`;
    return `Every ${every} weeks · ${weekday}`;
  }

  if (!chore.daySpecific) {
    return every === 1 ? 'Every month' : `Every ${every} months`;
  }
  const day = ordinal(clampMonthDay(chore.monthDay));
  if (every === 1) return `Monthly on the ${day}`;
  if (every === 2) return `Every 2 months · ${day}`;
  if (every === 6) return `Every 6 months · ${day}`;
  return `Every ${every} months · ${day}`;
}

function normalizeOccurrences(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [occurrence, completedOn] of Object.entries(raw as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(occurrence) && typeof completedOn === 'string') {
      out[occurrence] = completedOn;
    }
  }
  return out;
}

function pruneOccurrences(occurrences: Record<string, string>, from: Date): Record<string, string> {
  const cutoff = formatDate(shiftDate(from, -OCCURRENCE_HISTORY_DAYS));
  return Object.fromEntries(Object.entries(occurrences).filter(([occurrence]) => occurrence >= cutoff));
}

export function normalizeChore(raw: unknown): Chore | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.title !== 'string') return null;

  const legacyCadence = row.cadence === 'daily' || row.cadence === 'weekly' ? row.cadence : null;
  const unit: ChoreIntervalUnit =
    row.unit === 'days' || row.unit === 'weeks' || row.unit === 'months'
      ? row.unit
      : legacyCadence === 'daily'
        ? 'days'
        : 'weeks';

  return {
    id: row.id,
    title: row.title,
    assignee: typeof row.assignee === 'string' ? row.assignee : '',
    every: row.every != null ? clampEvery(row.every) : 1,
    unit,
    weekday: clampWeekday(row.weekday),
    monthDay: row.monthDay != null ? clampMonthDay(row.monthDay) : 1,
    // Chores stored before day specific scheduling existed were anchored to a weekday or
    // day of month, so keep those fixed and let every-n-days chores float.
    daySpecific: typeof row.daySpecific === 'boolean' ? row.daySpecific : unit !== 'days',
    lastCompletedOn: typeof row.lastCompletedOn === 'string' ? row.lastCompletedOn : null,
    completedOccurrences: normalizeOccurrences(row.completedOccurrences),
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString(),
    icon: isIcon(row.icon) ? row.icon : 'generic',
  };
}

const defaultChores = (): Chore[] => {
  const now = new Date().toISOString();
  const today = formatDate(new Date());
  const yesterday = formatDate(shiftDate(new Date(), -1));
  const weekday = new Date().getDay();
  const monthDay = Math.min(28, new Date().getDate());

  return [
    {
      id: generateUUID(),
      title: 'Take bins out',
      assignee: 'Jake',
      every: 1,
      unit: 'weeks',
      weekday,
      monthDay,
      icon: 'bins',
      daySpecific: true,
      lastCompletedOn: null,
      completedOccurrences: {},
      createdAt: now,
    },
    {
      id: generateUUID(),
      title: 'Vacuum upstairs',
      assignee: 'Wife',
      every: 14,
      unit: 'days',
      weekday,
      monthDay,
      icon: 'vacuum',
      daySpecific: false,
      lastCompletedOn: null,
      completedOccurrences: {},
      createdAt: now,
    },
    {
      id: generateUUID(),
      title: 'Clean bathrooms',
      assignee: 'Jake',
      every: 1,
      unit: 'months',
      weekday,
      monthDay,
      icon: 'bath',
      daySpecific: true,
      lastCompletedOn: today,
      completedOccurrences: { [today]: today },
      createdAt: now,
    },
    {
      id: generateUUID(),
      title: 'Water plants',
      assignee: 'Wife',
      every: 3,
      unit: 'days',
      weekday,
      monthDay,
      icon: 'plants',
      daySpecific: false,
      lastCompletedOn: yesterday,
      completedOccurrences: {},
      createdAt: now,
    },
  ];
};

function createdOn(chore: Chore): Date {
  const parsed = new Date(chore.createdAt);
  if (Number.isFinite(parsed.getTime())) return startOfDay(parsed);
  return startOfDay(new Date());
}

/** Days between fixed slots, or null for month based schedules. */
function fixedStepDays(chore: Chore): number | null {
  const every = clampEvery(chore.every);
  if (chore.unit === 'days') return every;
  if (chore.unit === 'weeks') return every * 7;
  return null;
}

/** The first fixed slot of a day specific chore. */
function fixedAnchor(chore: Chore): Date {
  const created = createdOn(chore);
  if (chore.unit === 'weeks') {
    return shiftDate(created, (clampWeekday(chore.weekday) - created.getDay() + 7) % 7);
  }
  if (chore.unit === 'months') {
    const monthDay = clampMonthDay(chore.monthDay);
    const slot = addMonthsOnDay(created, 0, monthDay);
    return slot < created ? addMonthsOnDay(created, 1, monthDay) : slot;
  }
  return created;
}

function addFixedInterval(chore: Chore, from: Date): Date {
  const step = fixedStepDays(chore);
  if (step != null) return startOfDay(shiftDate(from, step));
  return addMonthsOnDay(from, clampEvery(chore.every), clampMonthDay(chore.monthDay));
}

function subtractFixedInterval(chore: Chore, from: Date): Date {
  const step = fixedStepDays(chore);
  if (step != null) return startOfDay(shiftDate(from, -step));
  return addMonthsOnDay(from, -clampEvery(chore.every), clampMonthDay(chore.monthDay));
}

function fixedSlotOnOrAfter(chore: Chore, date: Date): Date {
  const anchor = fixedAnchor(chore);
  const target = startOfDay(date);
  if (target <= anchor) return anchor;

  const step = fixedStepDays(chore);
  if (step != null) {
    return shiftDate(anchor, Math.ceil(daysBetween(anchor, target) / step) * step);
  }

  const every = clampEvery(chore.every);
  const monthDay = clampMonthDay(chore.monthDay);
  const months = (target.getFullYear() - anchor.getFullYear()) * 12 + (target.getMonth() - anchor.getMonth());
  let steps = Math.max(0, Math.floor(months / every));
  let slot = addMonthsOnDay(anchor, steps * every, monthDay);
  let guard = 0;
  while (slot < target && guard < WALK_GUARD) {
    steps += 1;
    slot = addMonthsOnDay(anchor, steps * every, monthDay);
    guard += 1;
  }
  return slot;
}

/** The fixed slot on the given day, or the one right before it. */
function fixedSlotOnOrBefore(chore: Chore, date: Date): Date | null {
  const target = startOfDay(date);
  const slot = fixedSlotOnOrAfter(chore, target);
  if (slot.getTime() === target.getTime()) return slot;
  const previous = subtractFixedInterval(chore, slot);
  return previous < fixedAnchor(chore) ? null : previous;
}

function isOccurrenceCleared(chore: Chore, occurrence: string): boolean {
  return chore.completedOccurrences[occurrence] != null;
}

function addFloatingInterval(chore: Chore, from: Date): Date {
  const every = clampEvery(chore.every);
  if (chore.unit === 'days') return startOfDay(shiftDate(from, every));
  if (chore.unit === 'weeks') return startOfDay(shiftDate(from, every * 7));
  return addMonthsKeepingDay(from, every);
}

export function nextDueDate(chore: Chore, from = new Date()): Date {
  const today = startOfDay(from);

  if (chore.daySpecific) {
    // A missed slot stays on its own date; otherwise look ahead to the next open slot.
    const previous = fixedSlotOnOrBefore(chore, today);
    if (previous && !isOccurrenceCleared(chore, formatDate(previous))) return previous;

    let cursor = fixedSlotOnOrAfter(chore, shiftDate(today, 1));
    let guard = 0;
    while (isOccurrenceCleared(chore, formatDate(cursor)) && guard < WALK_GUARD) {
      cursor = addFixedInterval(chore, cursor);
      guard += 1;
    }
    return cursor;
  }

  if (!chore.lastCompletedOn) {
    // Flexible chores are due the day they were created and carry over until done.
    const created = createdOn(chore);
    return created > today ? created : today;
  }
  const due = addFloatingInterval(chore, parseDate(chore.lastCompletedOn));
  return due < today ? today : due;
}

/** The occurrence that completing the chore right now would satisfy. */
export function currentOccurrence(chore: Chore, from = new Date()): string {
  return formatDate(nextDueDate(chore, from));
}

function dueStatus(due: Date, from: Date): ChoreStatus {
  const today = formatDate(from);
  const tomorrow = formatDate(shiftDate(from, 1));
  const dueOn = formatDate(due);
  const shortDate = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (dueOn < today) {
    return { label: `Overdue · ${shortDate}`, tone: 'overdue', dueOn };
  }
  if (dueOn === today) {
    return { label: 'Due today', tone: 'today', dueOn };
  }
  if (dueOn === tomorrow) {
    return { label: 'Due tomorrow', tone: 'tomorrow', dueOn };
  }
  return { label: shortDate, tone: 'muted', dueOn };
}

export function getChoreStatus(chore: Chore, from = new Date()): ChoreStatus {
  const today = formatDate(from);
  const yesterday = formatDate(shiftDate(from, -1));
  const due = nextDueDate(chore, from);
  const status = dueStatus(due, from);

  if (chore.lastCompletedOn === today) {
    return { label: 'Completed', tone: 'done', dueOn: status.dueOn };
  }
  if (chore.lastCompletedOn === yesterday && status.dueOn !== today) {
    return { label: 'Done yesterday', tone: 'yesterday', dueOn: status.dueOn };
  }
  return status;
}

/** Days covered by the "due soon" queue, counting today. */
export const CHORE_QUEUE_DAYS = 7;

export interface ChoreQueueItem {
  chore: Chore;
  status: ChoreStatus;
}

/**
 * Outstanding chores: anything overdue or due within the next week. Chores finished
 * today drop off, and so does the next cycle when it lands past the horizon — a weekly
 * chore completed on Saturday does not come back until the following week rolls in.
 */
export function choreQueue(
  chores: Chore[],
  from = new Date(),
  withinDays = CHORE_QUEUE_DAYS,
): ChoreQueueItem[] {
  const today = formatDate(from);
  const horizon = formatDate(shiftDate(from, withinDays - 1));

  return chores
    .filter((chore) => chore.lastCompletedOn !== today)
    .map((chore) => ({ chore, status: dueStatus(nextDueDate(chore, from), from) }))
    .filter(({ status }) => status.dueOn <= horizon)
    .sort((a, b) => a.status.dueOn.localeCompare(b.status.dueOn) || a.chore.title.localeCompare(b.chore.title));
}

export const CHORE_EVENT_PREFIX = 'chore:';

export function isChoreEventId(id: string): boolean {
  return id.startsWith(CHORE_EVENT_PREFIX);
}

export function parseChoreEventId(id: string): { choreId: string; date: string } | null {
  if (!isChoreEventId(id)) return null;
  const rest = id.slice(CHORE_EVENT_PREFIX.length);
  const sep = rest.lastIndexOf(':');
  if (sep <= 0) return null;
  return { choreId: rest.slice(0, sep), date: rest.slice(sep + 1) };
}

/** Outstanding due dates in [start, end]. Completed occurrences are left out. */
export function choreDueDatesInRange(chore: Chore, start: Date, end: Date, from = new Date()): string[] {
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);
  const dates: string[] = [];
  // Nothing before the current due date is still outstanding.
  const due = nextDueDate(chore, from);
  const walkFrom = rangeStart > due ? rangeStart : due;
  let guard = 0;

  if (chore.daySpecific) {
    let cursor = fixedSlotOnOrAfter(chore, walkFrom);
    while (cursor <= rangeEnd && guard < WALK_GUARD) {
      const date = formatDate(cursor);
      if (cursor >= rangeStart && !isOccurrenceCleared(chore, date)) dates.push(date);
      cursor = addFixedInterval(chore, cursor);
      guard += 1;
    }
    return dates;
  }

  let cursor = due;
  while (cursor < rangeStart && guard < WALK_GUARD) {
    cursor = addFloatingInterval(chore, cursor);
    guard += 1;
  }
  while (cursor <= rangeEnd && guard < WALK_GUARD) {
    dates.push(formatDate(cursor));
    cursor = addFloatingInterval(chore, cursor);
    guard += 1;
  }
  return dates;
}

export function toChoreCalendarEvents(
  chores: Chore[],
  start: Date,
  end: Date,
  from = new Date(),
): CalendarEvent[] {
  return chores.flatMap((chore) =>
    choreDueDatesInRange(chore, start, end, from).map((date) => ({
      id: `${CHORE_EVENT_PREFIX}${chore.id}:${date}`,
      title: chore.title,
      description: `${chore.assignee} · ${formatChoreInterval(chore)}`,
      date,
      type: 'task' as const,
    })),
  );
}

export function mergeChoresIntoEvents(
  events: CalendarEvent[],
  chores: Chore[],
  start: Date,
  end: Date,
  from = new Date(),
): CalendarEvent[] {
  const choreEvents = toChoreCalendarEvents(chores, start, end, from);
  if (choreEvents.length === 0) return events;
  return [...events, ...choreEvents];
}

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: defaultChores(),
      addChore: (draft) => {
        const chore: Chore = {
          id: generateUUID(),
          lastCompletedOn: null,
          completedOccurrences: {},
          createdAt: new Date().toISOString(),
          title: draft.title,
          assignee: draft.assignee,
          every: clampEvery(draft.every),
          unit: draft.unit,
          weekday: clampWeekday(draft.weekday),
          monthDay: clampMonthDay(draft.monthDay),
          icon: draft.icon,
          daySpecific: draft.daySpecific,
        };
        set({ chores: [...get().chores, chore] });
        return chore;
      },
      updateChore: (id, draft) => {
        set({
          chores: get().chores.map((chore) => {
            if (chore.id !== id) return chore;
            const next = {
              ...chore,
              ...draft,
              every: draft.every != null ? clampEvery(draft.every) : chore.every,
              weekday: draft.weekday != null ? clampWeekday(draft.weekday) : chore.weekday,
              monthDay: draft.monthDay != null ? clampMonthDay(draft.monthDay) : chore.monthDay,
            };
            // Cleared slots belong to the old schedule, so drop them when it changes.
            const rescheduled =
              next.daySpecific !== chore.daySpecific ||
              next.unit !== chore.unit ||
              next.every !== chore.every ||
              next.weekday !== chore.weekday ||
              next.monthDay !== chore.monthDay;
            return rescheduled ? { ...next, completedOccurrences: {} } : next;
          }),
        });
      },
      removeChore: (id) => {
        set({ chores: get().chores.filter((chore) => chore.id !== id) });
      },
      toggleComplete: (id, onDate = new Date()) => {
        const day = formatDate(onDate);
        set({
          chores: get().chores.map((chore) => {
            if (chore.id !== id) return chore;

            if (chore.lastCompletedOn === day) {
              return {
                ...chore,
                lastCompletedOn: null,
                completedOccurrences: Object.fromEntries(
                  Object.entries(chore.completedOccurrences).filter(([, completedOn]) => completedOn !== day),
                ),
              };
            }

            if (!chore.daySpecific) {
              // The next due date is measured from today, so the schedule shifts with it.
              return { ...chore, lastCompletedOn: day };
            }

            return {
              ...chore,
              lastCompletedOn: day,
              completedOccurrences: pruneOccurrences(
                { ...chore.completedOccurrences, [currentOccurrence(chore, onDate)]: day },
                onDate,
              ),
            };
          }),
        });
      },
    }),
    {
      name: 'chore-storage',
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as { chores?: unknown[] } | undefined;
        const chores = Array.isArray(state?.chores)
          ? state.chores.map(normalizeChore).filter((chore): chore is Chore => chore != null)
          : [];
        return { chores };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.chores = state.chores
          .map(normalizeChore)
          .filter((chore): chore is Chore => chore != null);
      },
    },
  ),
);
