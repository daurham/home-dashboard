import { describe, expect, it } from 'vitest';
import { formatDate } from '@/lib/calendar';
import {
  choreDueDatesInRange,
  choreQueue,
  currentOccurrence,
  formatChoreInterval,
  getChoreStatus,
  nextDueDate,
  normalizeChore,
  type Chore,
} from '@/lib/store/choreStore';

function chore(overrides: Partial<Chore>): Chore {
  return {
    id: '1',
    title: 'Test',
    assignee: 'Jake',
    every: 3,
    unit: 'days',
    weekday: 2,
    monthDay: 15,
    daySpecific: false,
    lastCompletedOn: null,
    completedOccurrences: {},
    createdAt: '2026-09-01T12:00:00.000Z',
    icon: 'generic',
    ...overrides,
  };
}

describe('chore intervals', () => {
  it('formats every-n-days, weekly, and multi-month cadences', () => {
    expect(formatChoreInterval(chore({ every: 3, unit: 'days' }))).toBe('Every 3 days');
    expect(formatChoreInterval(chore({ every: 1, unit: 'weeks', weekday: 2, daySpecific: true }))).toBe('Every Tuesday');
    expect(formatChoreInterval(chore({ every: 2, unit: 'weeks', daySpecific: false }))).toBe('Every 2 weeks');
    expect(formatChoreInterval(chore({ every: 2, unit: 'months', monthDay: 15, daySpecific: true }))).toBe(
      'Every 2 months · 15th',
    );
    expect(formatChoreInterval(chore({ every: 6, unit: 'months', monthDay: 1, daySpecific: true }))).toBe(
      'Every 6 months · 1st',
    );
  });

  it('uses last completed + N days for day intervals', () => {
    const from = new Date('2026-09-15T12:00:00');
    const due = nextDueDate(chore({ lastCompletedOn: '2026-09-13', every: 3, unit: 'days' }), from);
    expect(formatDate(due)).toBe('2026-09-16');
  });

  it('treats overdue day chores as due today', () => {
    const from = new Date('2026-09-15T12:00:00');
    const due = nextDueDate(chore({ lastCompletedOn: '2026-09-01', every: 3, unit: 'days' }), from);
    expect(formatDate(due)).toBe('2026-09-15');
  });

  it('adds N months on the chosen day', () => {
    const from = new Date('2026-09-15T12:00:00');
    const due = nextDueDate(
      chore({ lastCompletedOn: '2026-03-15', every: 6, unit: 'months', monthDay: 15, daySpecific: true }),
      from,
    );
    expect(formatDate(due)).toBe('2026-09-15');
  });

  it('marks a chore completed today even if the next due is later', () => {
    const from = new Date('2026-09-15T12:00:00');
    const status = getChoreStatus(
      chore({ lastCompletedOn: '2026-09-15', every: 14, unit: 'days' }),
      from,
    );
    expect(status.tone).toBe('done');
    expect(status.label).toBe('Completed');
  });

  it('places weekly chores on matching weekdays in a range', () => {
    const from = new Date('2026-09-15T12:00:00'); // Tuesday
    const start = new Date('2026-09-15T00:00:00');
    const end = new Date('2026-09-28T00:00:00');
    const dates = choreDueDatesInRange(
      chore({ every: 1, unit: 'weeks', weekday: 2, daySpecific: true, createdAt: '2026-09-01T12:00:00.000Z' }),
      start,
      end,
      from,
    );
    expect(dates).toEqual(['2026-09-15', '2026-09-22']);
  });

  it('steps every-n-days from last completed', () => {
    const from = new Date('2026-09-15T12:00:00');
    const dates = choreDueDatesInRange(
      chore({ lastCompletedOn: '2026-09-13', every: 3, unit: 'days' }),
      new Date('2026-09-15T00:00:00'),
      new Date('2026-09-22T00:00:00'),
      from,
    );
    expect(dates).toEqual(['2026-09-16', '2026-09-19', '2026-09-22']);
  });

  it('shows overdue chores today and keeps the future cadence', () => {
    const from = new Date('2026-09-15T12:00:00');
    const dates = choreDueDatesInRange(
      chore({ lastCompletedOn: '2026-09-01', every: 3, unit: 'days' }),
      new Date('2026-09-15T00:00:00'),
      new Date('2026-09-19T00:00:00'),
      from,
    );
    expect(dates[0]).toBe('2026-09-15');
    expect(dates).toContain('2026-09-18');
  });

  it('migrates legacy daily/weekly chores', () => {
    const daily = normalizeChore({
      id: 'a',
      title: 'Dishes',
      assignee: 'Jake',
      cadence: 'daily',
      weekday: 1,
      lastCompletedOn: null,
      createdAt: 'x',
      icon: 'kitchen',
    });
    expect(daily?.unit).toBe('days');
    expect(daily?.every).toBe(1);
    expect(daily?.daySpecific).toBe(false);

    const weekly = normalizeChore({
      id: 'b',
      title: 'Bins',
      assignee: 'Jake',
      cadence: 'weekly',
      weekday: 4,
      lastCompletedOn: null,
      createdAt: 'x',
      icon: 'bins',
    });
    expect(weekly?.unit).toBe('weeks');
    expect(weekly?.weekday).toBe(4);
    expect(weekly?.daySpecific).toBe(true);
    expect(weekly?.completedOccurrences).toEqual({});
  });
});

describe('day specific chores', () => {
  // Every other Wednesday, anchored on Wed 2026-09-02: slots are 09-02, 09-16, 09-30.
  const biweeklyWednesday = (overrides: Partial<Chore> = {}) =>
    chore({
      every: 2,
      unit: 'weeks',
      weekday: 3,
      daySpecific: true,
      createdAt: '2026-09-02T12:00:00.000Z',
      completedOccurrences: { '2026-09-02': '2026-09-02' },
      ...overrides,
    });

  it('keeps fixed slots on the calendar', () => {
    const from = new Date('2026-09-15T12:00:00'); // Tuesday
    const dates = choreDueDatesInRange(
      biweeklyWednesday(),
      new Date('2026-09-13T00:00:00'),
      new Date('2026-10-10T00:00:00'),
      from,
    );
    expect(dates).toEqual(['2026-09-16', '2026-09-30']);
  });

  it('clears only the upcoming occurrence when finished early', () => {
    const from = new Date('2026-09-15T12:00:00'); // Tuesday, one day early
    const target = biweeklyWednesday();
    expect(currentOccurrence(target, from)).toBe('2026-09-16');

    const afterEarlyFinish = biweeklyWednesday({
      lastCompletedOn: '2026-09-15',
      completedOccurrences: { '2026-09-02': '2026-09-02', '2026-09-16': '2026-09-15' },
    });
    const dates = choreDueDatesInRange(
      afterEarlyFinish,
      new Date('2026-09-13T00:00:00'),
      new Date('2026-10-10T00:00:00'),
      from,
    );
    // The Tuesday it was finished on does not become a new slot, and 09-30 stays put.
    expect(dates).toEqual(['2026-09-30']);
  });

  it('leaves a missed slot on its own date and reports it overdue', () => {
    const from = new Date('2026-09-18T12:00:00'); // Friday, 09-16 was skipped
    const missed = biweeklyWednesday();
    const status = getChoreStatus(missed, from);
    expect(status.tone).toBe('overdue');
    expect(status.dueOn).toBe('2026-09-16');
    expect(currentOccurrence(missed, from)).toBe('2026-09-16');

    const dates = choreDueDatesInRange(
      missed,
      new Date('2026-09-13T00:00:00'),
      new Date('2026-10-10T00:00:00'),
      from,
    );
    expect(dates).toEqual(['2026-09-16', '2026-09-30']);
  });

  it('keeps monthly slots on the chosen day of the month', () => {
    const from = new Date('2026-09-10T12:00:00');
    const dates = choreDueDatesInRange(
      chore({
        every: 1,
        unit: 'months',
        monthDay: 15,
        daySpecific: true,
        createdAt: '2026-09-01T12:00:00.000Z',
      }),
      new Date('2026-09-01T00:00:00'),
      new Date('2026-11-30T00:00:00'),
      from,
    );
    expect(dates).toEqual(['2026-09-15', '2026-10-15', '2026-11-15']);
  });
});

describe('chore queue', () => {
  const from = new Date('2026-09-19T12:00:00'); // Saturday

  const overdue = chore({
    id: 'overdue',
    title: 'Bins',
    every: 1,
    unit: 'weeks',
    weekday: 3, // Wednesday, missed on 09-16
    daySpecific: true,
    createdAt: '2026-09-02T12:00:00.000Z',
  });
  const dueToday = chore({ id: 'today', title: 'Dishes', every: 3, unit: 'days', createdAt: '2026-09-19T12:00:00.000Z' });
  const dueNextWeek = chore({ id: 'soon', title: 'Vacuum', every: 3, unit: 'days', lastCompletedOn: '2026-09-19' });
  const dueAfterHorizon = chore({
    id: 'later',
    title: 'Filters',
    every: 1,
    unit: 'months',
    monthDay: 1,
    daySpecific: true,
    createdAt: '2026-09-02T12:00:00.000Z',
  });

  it('lists overdue and due-today chores by due date', () => {
    const queue = choreQueue([dueToday, overdue], from);
    expect(queue.map(({ chore: item }) => item.id)).toEqual(['overdue', 'today']);
    expect(queue[0].status.tone).toBe('overdue');
    expect(queue[1].status.tone).toBe('today');
  });

  it('hides chores completed today', () => {
    expect(choreQueue([dueNextWeek], from)).toEqual([]);
  });

  it('hides chores that are not due yet', () => {
    expect(choreQueue([dueAfterHorizon], from)).toEqual([]);
    expect(choreQueue([dueNextWeek], from)).toEqual([]);
  });

  it('does not bring a weekly chore back until it is due again', () => {
    const weeklySaturday = chore({
      id: 'weekly',
      every: 1,
      unit: 'weeks',
      weekday: 6,
      daySpecific: true,
      createdAt: '2026-09-05T12:00:00.000Z',
      lastCompletedOn: '2026-09-19',
      completedOccurrences: { '2026-09-19': '2026-09-19' },
    });
    expect(formatDate(nextDueDate(weeklySaturday, from))).toBe('2026-09-26');
    expect(choreQueue([weeklySaturday], from)).toEqual([]);
    expect(choreQueue([weeklySaturday], new Date('2026-09-20T12:00:00'))).toEqual([]);
    expect(choreQueue([weeklySaturday], new Date('2026-09-26T12:00:00'))).toHaveLength(1);
  });
});

describe('flexible chores', () => {
  it('is due on the day it was created', () => {
    const from = new Date('2026-09-15T12:00:00');
    const fresh = chore({ every: 2, unit: 'weeks', createdAt: '2026-09-15T12:00:00.000Z' });
    expect(formatDate(nextDueDate(fresh, from))).toBe('2026-09-15');
    expect(getChoreStatus(fresh, from).tone).toBe('today');
  });

  it('carries over to the next day until it is done', () => {
    const from = new Date('2026-09-18T12:00:00');
    const stale = chore({ every: 2, unit: 'weeks', createdAt: '2026-09-15T12:00:00.000Z' });
    expect(formatDate(nextDueDate(stale, from))).toBe('2026-09-18');

    const dates = choreDueDatesInRange(
      stale,
      new Date('2026-09-13T00:00:00'),
      new Date('2026-10-05T00:00:00'),
      from,
    );
    expect(dates).toEqual(['2026-09-18', '2026-10-02']);
  });

  it('rebases the schedule on the day it was completed', () => {
    const from = new Date('2026-09-15T12:00:00'); // Tuesday
    // Was a Wednesday chore, finished on Tuesday: the cadence moves to Tuesdays.
    const dates = choreDueDatesInRange(
      chore({ every: 1, unit: 'weeks', weekday: 3, lastCompletedOn: '2026-09-15' }),
      new Date('2026-09-13T00:00:00'),
      new Date('2026-10-05T00:00:00'),
      from,
    );
    expect(dates).toEqual(['2026-09-22', '2026-09-29']);
  });
});
