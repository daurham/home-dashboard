/**
 * Household expense week: Friday 00:00:00.000 → Thursday 23:59:59.999
 * in the household timezone.
 *
 * Default timezone is America/Phoenix (Arizona, no DST).
 *
 * Month vs week: aggregation by week uses the Friday of the Fri–Thu range.
 * Aggregation by month uses the calendar month of occurred_on. A week that
 * crosses months (e.g. Fri Oct 30 – Thu Nov 5) stays one weekKey but splits
 * across October and November in month charts.
 */

export const DEFAULT_EXPENSE_TIMEZONE = 'America/Phoenix';

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface CalendarYmd {
  year: number;
  month: number;
  day: number;
}

export interface ExpenseWeekRange {
  weekStart: Date;
  weekEnd: Date;
  weekKey: string;
  weekStartDate: string;
  weekEndDate: string;
}

export interface ExpenseMonthRange {
  monthStart: Date;
  monthEnd: Date;
  monthKey: string;
  monthStartDate: string;
  monthEndDate: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatYmd({ year, month, day }: CalendarYmd): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function addCalendarDays(year: number, month: number, day: number, days: number): CalendarYmd {
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  };
}

export function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: map.weekday,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const truncated = Math.floor(date.getTime() / 1000) * 1000;
  return asUtc - truncated;
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  const offset1 = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const instant = utcGuess - offset1;
  const offset2 = getTimeZoneOffsetMs(new Date(instant), timeZone);
  return new Date(utcGuess - offset2 + ms);
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseInput(date: Date | string, timeZone: string): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return zonedTimeToUtc(year, month, day, 12, 0, 0, 0, timeZone);
  }
  return new Date(date);
}

export function getExpenseWeekRange(
  date: Date | string,
  timeZone: string = DEFAULT_EXPENSE_TIMEZONE,
): ExpenseWeekRange {
  const instant = parseInput(date, timeZone);
  const parts = getZonedParts(instant, timeZone);
  const dow = WEEKDAY_INDEX[parts.weekday];
  if (dow === undefined) {
    throw new Error(`Unexpected weekday: ${parts.weekday}`);
  }
  const daysSinceFriday = (dow - 5 + 7) % 7;
  const start = addCalendarDays(parts.year, parts.month, parts.day, -daysSinceFriday);
  const end = addCalendarDays(start.year, start.month, start.day, 6);
  const weekKey = formatYmd(start);

  return {
    weekStart: zonedTimeToUtc(start.year, start.month, start.day, 0, 0, 0, 0, timeZone),
    weekEnd: zonedTimeToUtc(end.year, end.month, end.day, 23, 59, 59, 999, timeZone),
    weekKey,
    weekStartDate: weekKey,
    weekEndDate: formatYmd(end),
  };
}

export function getExpenseMonthRange(
  date: Date | string,
  timeZone: string = DEFAULT_EXPENSE_TIMEZONE,
): ExpenseMonthRange {
  const instant = parseInput(date, timeZone);
  const parts = getZonedParts(instant, timeZone);
  const last = lastDayOfMonth(parts.year, parts.month);
  return {
    monthStart: zonedTimeToUtc(parts.year, parts.month, 1, 0, 0, 0, 0, timeZone),
    monthEnd: zonedTimeToUtc(parts.year, parts.month, last, 23, 59, 59, 999, timeZone),
    monthKey: `${parts.year}-${pad2(parts.month)}`,
    monthStartDate: formatYmd({ year: parts.year, month: parts.month, day: 1 }),
    monthEndDate: formatYmd({ year: parts.year, month: parts.month, day: last }),
  };
}

export function todayYmd(timeZone: string = DEFAULT_EXPENSE_TIMEZONE): string {
  return formatYmd(getZonedParts(new Date(), timeZone));
}

export function shiftWeekKey(weekKey: string, weeks: number): string {
  const [year, month, day] = weekKey.split('-').map(Number);
  return formatYmd(addCalendarDays(year, month, day, weeks * 7));
}

export function shiftMonthKey(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}`;
}

export function resolveTimeZone(value?: string | null): string {
  const timeZone = value || DEFAULT_EXPENSE_TIMEZONE;
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_EXPENSE_TIMEZONE;
  }
}
