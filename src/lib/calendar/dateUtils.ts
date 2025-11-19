/**
 * Date utility functions for formatting and comparison
 */

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Parse a date string (YYYY-MM-DD) into a Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Get the start of a day (midnight) for a given date
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a day (23:59:59.999) for a given date
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format month and year (e.g., "January 2024")
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Check if a date is the first day of its month
 */
export function isFirstDayOfMonth(date: Date): boolean {
  return date.getDate() === 1;
}

