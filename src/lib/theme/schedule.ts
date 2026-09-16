export const DEFAULT_DARK_STARTS_AT = '20:00';
export const DEFAULT_DARK_ENDS_AT = '07:00';

function minutesFromMidnight(value: string): number {
  const [hoursText, minutesText] = value.split(':');
  const hours = Number.parseInt(hoursText ?? '0', 10);
  const minutes = Number.parseInt(minutesText ?? '0', 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return Math.min(23, Math.max(0, hours)) * 60 + Math.min(59, Math.max(0, minutes));
}

function clockMinutes(date: Date, timeZone?: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

/**
 * Overnight windows (8pm–7am) return true at night.
 * Weather `isDaytime === false` can switch earlier than the clock, but the
 * scheduled start still forces dark so an always-on kiosk is never bright late.
 */
export function isAutoDark(
  date: Date,
  darkStartsAt = DEFAULT_DARK_STARTS_AT,
  darkEndsAt = DEFAULT_DARK_ENDS_AT,
  timeZone?: string,
  isDaytime?: boolean | null,
): boolean {
  const now = clockMinutes(date, timeZone);
  const start = minutesFromMidnight(darkStartsAt);
  const end = minutesFromMidnight(darkEndsAt);
  const scheduled = start === end
    ? false
    : start > end
      ? now >= start || now < end
      : now >= start && now < end;

  if (scheduled) return true;
  if (isDaytime === false) return true;
  return false;
}
