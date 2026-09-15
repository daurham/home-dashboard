import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPENSE_TIMEZONE,
  getExpenseMonthRange,
  getExpenseWeekRange,
} from './weekRange';

const TZ = DEFAULT_EXPENSE_TIMEZONE;

describe('getExpenseWeekRange', () => {
  it('assigns Friday 00:00 local to that week', () => {
    const midnightFriday = new Date('2026-09-11T07:00:00.000Z');
    const range = getExpenseWeekRange(midnightFriday, TZ);
    expect(range.weekKey).toBe('2026-09-11');
    expect(range.weekStartDate).toBe('2026-09-11');
    expect(range.weekEndDate).toBe('2026-09-17');
    expect(range.weekStart.toISOString()).toBe('2026-09-11T07:00:00.000Z');
  });

  it('assigns Thursday 23:59 local to that same week', () => {
    const endThursday = new Date('2026-09-18T06:59:59.999Z');
    const range = getExpenseWeekRange(endThursday, TZ);
    expect(range.weekKey).toBe('2026-09-11');
    expect(range.weekEnd.toISOString()).toBe('2026-09-18T06:59:59.999Z');
  });

  it('assigns Friday after midnight to the next week', () => {
    const nextFriday = new Date('2026-09-18T07:00:00.000Z');
    const range = getExpenseWeekRange(nextFriday, TZ);
    expect(range.weekKey).toBe('2026-09-18');
    expect(range.weekStartDate).toBe('2026-09-18');
    expect(range.weekEndDate).toBe('2026-09-24');
  });

  it('treats YYYY-MM-DD occurred_on as that calendar day', () => {
    expect(getExpenseWeekRange('2026-09-11', TZ).weekKey).toBe('2026-09-11');
    expect(getExpenseWeekRange('2026-09-17', TZ).weekKey).toBe('2026-09-11');
    expect(getExpenseWeekRange('2026-09-18', TZ).weekKey).toBe('2026-09-18');
  });

  it('documents month vs week mismatch across a month boundary', () => {
    // Fri Oct 30 2026 – Thu Nov 5 2026 is one weekKey (the Friday).
    // Month charts use occurred_on's calendar month, so Oct 30 is October
    // and Nov 1 is November even though they share a week.
    expect(getExpenseWeekRange('2026-10-30', TZ).weekKey).toBe('2026-10-30');
    expect(getExpenseWeekRange('2026-11-05', TZ).weekKey).toBe('2026-10-30');
    expect(getExpenseWeekRange('2026-11-01', TZ).weekKey).toBe('2026-10-30');
    expect(getExpenseMonthRange('2026-10-30', TZ).monthKey).toBe('2026-10');
    expect(getExpenseMonthRange('2026-11-01', TZ).monthKey).toBe('2026-11');
  });

  it('survives the spring-forward DST edge in America/Los_Angeles', () => {
    const range = getExpenseWeekRange('2026-03-08', TZ);
    expect(range.weekKey).toBe('2026-03-06');
    expect(range.weekEndDate).toBe('2026-03-12');
    expect(getExpenseWeekRange('2026-03-06', TZ).weekStart.toISOString()).toBe(
      '2026-03-06T08:00:00.000Z',
    );
  });
});
