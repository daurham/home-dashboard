/**
 * Calendar utility functions
 * 
 * Organized by concern:
 * - dateUtils: Date formatting and comparison
 * - calendarMath: Week calculations and date range shifts
 * - recurrence: Recurring event logic
 */

// Date utilities
export {
  formatDate,
  isSameDay,
  isToday,
  isWeekend,
  parseDate,
  startOfDay,
  endOfDay,
  formatMonthYear,
  isFirstDayOfMonth,
} from './dateUtils';

// Calendar math
export {
  getWeekStart,
  getWeekDates,
  getFourWeeks,
  shiftDate,
  shiftWeek,
  shiftMonth,
  daysBetween,
  getMonthStart,
  getMonthEnd,
} from './calendarMath';

// Month grid keyboard navigation
export {
  calendarKeyStep,
  shiftMonthKeepingDay,
} from './gridNavigation';

// Recurrence
export {
  shouldShowRecurringEvent,
  getEventsForDate,
  getRecurringOccurrences,
} from './recurrence';

