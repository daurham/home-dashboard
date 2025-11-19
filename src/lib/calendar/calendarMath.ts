/**
 * Calendar math utilities for week calculations and date range shifts
 */

/**
 * Get the start of a week for a given date
 * @param date - The date to get the week start for
 * @param firstDayOfWeek - 0 for Sunday, 1 for Monday (default: 1)
 */
export function getWeekStart(date: Date, firstDayOfWeek: 0 | 1 = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  
  if (firstDayOfWeek === 0) {
    // Week starts on Sunday
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  } else {
    // Week starts on Monday (default)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    return new Date(d.setDate(diff));
  }
}

/**
 * Get an array of dates for a given week
 */
export function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Get the four weeks to display: previous, current, next, and following
 * @param currentDate - The current date
 * @param firstDayOfWeek - 0 for Sunday, 1 for Monday (default: 1)
 */
export function getFourWeeks(currentDate: Date, firstDayOfWeek: 0 | 1 = 1): Date[][] {
  const currentWeekStart = getWeekStart(currentDate, firstDayOfWeek);
  const weeks: Date[][] = [];
  
  // Previous week
  const prevWeekStart = new Date(currentWeekStart);
  prevWeekStart.setDate(currentWeekStart.getDate() - 7);
  weeks.push(getWeekDates(prevWeekStart));
  
  // Current week
  weeks.push(getWeekDates(currentWeekStart));
  
  // Next week
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
  weeks.push(getWeekDates(nextWeekStart));
  
  // Following week
  const followingWeekStart = new Date(currentWeekStart);
  followingWeekStart.setDate(currentWeekStart.getDate() + 14);
  weeks.push(getWeekDates(followingWeekStart));
  
  return weeks;
}

/**
 * Shift a date by a specified number of days
 */
export function shiftDate(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}

/**
 * Shift a date by a specified number of weeks
 */
export function shiftWeek(date: Date, weeks: number): Date {
  return shiftDate(date, weeks * 7);
}

/**
 * Shift a date by a specified number of months
 */
export function shiftMonth(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + months);
  return newDate;
}

/**
 * Get the number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the start of a month for a given date
 */
export function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a month for a given date
 */
export function getMonthEnd(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

