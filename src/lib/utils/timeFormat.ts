/**
 * Shared time formatting utilities
 * Used by Clock and Calendar components
 */

export type TimeFormat = '12-hour' | '24-hour';

/**
 * Format a time string (HH:MM) to the specified format
 */
export function formatTimeString(time: string, format: TimeFormat): string {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':').map(Number);
  
  if (format === '12-hour') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

/**
 * Format a Date object's time to the specified format
 */
export function formatTimeFromDate(date: Date, format: TimeFormat, showSeconds = false): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  if (format === '12-hour') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')}${showSeconds ? `:${seconds.toString().padStart(2, '0')}` : ''}`;
    return `${timeStr} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${showSeconds ? `:${seconds.toString().padStart(2, '0')}` : ''}`;
  }
}

