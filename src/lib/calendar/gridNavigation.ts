import { shiftDate } from './calendarMath';

const ARROW_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

/**
 * Shift by whole months, clamping the day so late-month dates stay in the target
 * month (Jan 31 -> Feb 28 rather than Mar 3).
 */
export function shiftMonthKeepingDay(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  target.setHours(0, 0, 0, 0);
  return target;
}

/** Where a keypress moves the calendar selection, or null if the key does not navigate. */
export function calendarKeyStep(from: Date, key: string): Date | null {
  const days = ARROW_STEPS[key];
  if (days != null) return shiftDate(from, days);
  if (key === 'PageUp') return shiftMonthKeepingDay(from, -1);
  if (key === 'PageDown') return shiftMonthKeepingDay(from, 1);
  return null;
}
