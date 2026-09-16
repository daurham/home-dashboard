import { describe, expect, it } from 'vitest';
import {
  clampHabitWeekPageEnd,
  formatHabitWeekRange,
  getHabitWeekDays,
  habitExistsInWeek,
  habitProgress,
  habitsForWeek,
  isHabitTrackableOn,
  isSameHabitWeek,
  listHabitWeeks,
  shiftHabitWeekPage,
  type Habit,
} from './habitStore';
import { formatDate } from '@/lib/calendar';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Stretch',
    completions: {},
    createdAt: '2026-09-16T15:00:00.000Z',
    ...overrides,
  };
}

describe('habit week helpers', () => {
  it('lists the current week last', () => {
    const weeks = listHabitWeeks(new Date('2026-09-16T12:00:00'), 3, 1);
    expect(weeks).toHaveLength(3);
    expect(formatDate(weeks[2][0])).toBe('2026-09-14');
    expect(formatDate(weeks[0][0])).toBe('2026-08-31');
  });

  it('formats a same-month range', () => {
    expect(formatHabitWeekRange(getHabitWeekDays(new Date('2026-09-16T12:00:00'), 1))).toBe('Sep 14 – 20');
  });

  it('recognizes the same week', () => {
    expect(isSameHabitWeek(new Date('2026-09-14T12:00:00'), new Date('2026-09-16T12:00:00'), 1)).toBe(true);
    expect(isSameHabitWeek(new Date('2026-09-13T12:00:00'), new Date('2026-09-16T12:00:00'), 1)).toBe(false);
  });

  it('pages 4-week ranges like a calendar month', () => {
    const from = new Date('2026-09-16T12:00:00');
    const previous = shiftHabitWeekPage(from, -1, 1);
    expect(formatDate(previous)).toBe('2026-08-17');
    const weeks = listHabitWeeks(previous, 4, 1);
    expect(weeks).toHaveLength(4);
    expect(formatDate(weeks[0][0])).toBe('2026-07-27');
    expect(formatDate(weeks[3][0])).toBe('2026-08-17');
    expect(formatDate(clampHabitWeekPageEnd(shiftHabitWeekPage(from, 1, 1), from, 1))).toBe('2026-09-14');
  });
});

describe('habit start week', () => {
  const addedWednesday = habit({ createdAt: '2026-09-16T18:00:00.000Z' });
  const thisWeek = getHabitWeekDays(new Date('2026-09-16T12:00:00'), 1);
  const lastWeek = getHabitWeekDays(new Date('2026-09-09T12:00:00'), 1);

  it('does not exist in weeks that ended before it was added', () => {
    expect(habitExistsInWeek(addedWednesday, lastWeek)).toBe(false);
    expect(habitExistsInWeek(addedWednesday, thisWeek)).toBe(true);
    expect(habitsForWeek([addedWednesday], lastWeek)).toEqual([]);
  });

  it('is not trackable on days before it was added', () => {
    expect(isHabitTrackableOn(addedWednesday, new Date('2026-09-15T12:00:00'))).toBe(false);
    expect(isHabitTrackableOn(addedWednesday, new Date('2026-09-16T12:00:00'))).toBe(true);
  });

  it('counts progress only from the created day onward', () => {
    const tracked = habit({
      createdAt: '2026-09-16T18:00:00.000Z',
      completions: { '2026-09-16': true, '2026-09-17': true },
    });
    expect(habitProgress(tracked, thisWeek)).toEqual({ done: 2, total: 5 });
  });

  it('treats habits without a valid created date as always existing', () => {
    const legacy = habit({ createdAt: '' });
    expect(habitExistsInWeek(legacy, lastWeek)).toBe(true);
    expect(habitProgress(legacy, lastWeek).total).toBe(7);
  });
});
