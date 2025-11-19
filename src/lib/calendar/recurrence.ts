import { CalendarEvent, RecurrenceType } from '@/lib/store';
import { formatDate, parseDate } from './dateUtils';

/**
 * Recurrence utilities for handling recurring calendar events
 */

/**
 * Check if a recurring event should appear on a given date
 */
export function shouldShowRecurringEvent(
  event: CalendarEvent,
  targetDate: Date
): boolean {
  if (!event.recurrence) {
    return false;
  }

  const eventDate = parseDate(event.date);
  
  // Only show recurring events for dates after the original event
  if (targetDate < eventDate) {
    return false;
  }

  const targetDateStr = formatDate(targetDate);
  const eventDateStr = formatDate(eventDate);

  // If it's the original event date, show it
  if (targetDateStr === eventDateStr) {
    return true;
  }

  switch (event.recurrence) {
    case 'daily':
      return true;
    case 'weekly':
      // Same day of week
      return eventDate.getDay() === targetDate.getDay();
    case 'monthly':
      // Same day of month
      return eventDate.getDate() === targetDate.getDate();
    default:
      return false;
  }
}

/**
 * Get events for a specific date, including recurring events
 */
export function getEventsForDate(
  date: string,
  allEvents: CalendarEvent[]
): CalendarEvent[] {
  const targetDate = parseDate(date);
  
  return allEvents.filter(event => {
    // Direct date match
    if (event.date === date) {
      return true;
    }
    
    // Check recurrence
    return shouldShowRecurringEvent(event, targetDate);
  });
}

/**
 * Get all occurrences of a recurring event within a date range
 */
export function getRecurringOccurrences(
  event: CalendarEvent,
  startDate: Date,
  endDate: Date
): Date[] {
  if (!event.recurrence) {
    return [];
  }

  const occurrences: Date[] = [];
  const eventDate = parseDate(event.date);
  let currentDate = new Date(eventDate);

  // Start from the event date or startDate, whichever is later
  if (startDate > eventDate) {
    currentDate = new Date(startDate);
    // Adjust to match recurrence pattern
    switch (event.recurrence) {
      case 'daily':
        // Already at startDate
        break;
      case 'weekly':
        // Find next occurrence of the same weekday
        const daysDiff = (currentDate.getDay() - eventDate.getDay() + 7) % 7;
        if (daysDiff > 0) {
          currentDate.setDate(currentDate.getDate() - daysDiff + 7);
        }
        break;
      case 'monthly':
        // Find next occurrence of the same day of month
        if (currentDate.getDate() > eventDate.getDate()) {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        currentDate.setDate(eventDate.getDate());
        break;
    }
  }

  while (currentDate <= endDate) {
    if (currentDate >= startDate) {
      occurrences.push(new Date(currentDate));
    }

    // Move to next occurrence
    switch (event.recurrence) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return occurrences;
}

