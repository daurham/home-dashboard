import { describe, expect, it } from 'vitest';
import { formatDate } from './dateUtils';
import { calendarKeyStep, shiftMonthKeepingDay } from './gridNavigation';

const at = (date: string) => new Date(`${date}T00:00:00`);
const step = (date: string, key: string) => {
  const next = calendarKeyStep(at(date), key);
  return next ? formatDate(next) : null;
};

describe('calendarKeyStep', () => {
  it('moves a day at a time horizontally', () => {
    expect(step('2026-09-15', 'ArrowRight')).toBe('2026-09-16');
    expect(step('2026-09-15', 'ArrowLeft')).toBe('2026-09-14');
  });

  it('moves a week at a time vertically', () => {
    expect(step('2026-09-15', 'ArrowDown')).toBe('2026-09-22');
    expect(step('2026-09-15', 'ArrowUp')).toBe('2026-09-08');
  });

  it('crosses month and year boundaries', () => {
    expect(step('2026-09-30', 'ArrowRight')).toBe('2026-10-01');
    expect(step('2026-09-01', 'ArrowLeft')).toBe('2026-08-31');
    expect(step('2026-12-31', 'ArrowDown')).toBe('2027-01-07');
  });

  it('pages by month', () => {
    expect(step('2026-09-15', 'PageDown')).toBe('2026-10-15');
    expect(step('2026-09-15', 'PageUp')).toBe('2026-08-15');
  });

  it('ignores keys that are not navigation keys', () => {
    expect(step('2026-09-15', 'Enter')).toBeNull();
    expect(step('2026-09-15', 'a')).toBeNull();
  });
});

describe('shiftMonthKeepingDay', () => {
  it('clamps to the last day of a shorter month', () => {
    expect(formatDate(shiftMonthKeepingDay(at('2026-01-31'), 1))).toBe('2026-02-28');
    expect(formatDate(shiftMonthKeepingDay(at('2026-03-31'), -1))).toBe('2026-02-28');
  });

  it('keeps the day of month when it fits', () => {
    expect(formatDate(shiftMonthKeepingDay(at('2026-09-15'), 3))).toBe('2026-12-15');
    expect(formatDate(shiftMonthKeepingDay(at('2026-09-15'), -9))).toBe('2025-12-15');
  });
});
