import { format } from 'date-fns';
import { parseDate } from '@/lib/calendar';

export function formatWeekLabel(start: string, end: string): string {
  return `${format(parseDate(start), 'EEE MMM d')} – ${format(parseDate(end), 'EEE MMM d')}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return format(new Date(year, month - 1, 1), 'MMMM yyyy');
}

export function formatOccurredOn(ymd: string): string {
  return format(parseDate(ymd), 'EEE MMM d');
}
