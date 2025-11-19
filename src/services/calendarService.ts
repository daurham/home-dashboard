import { CalendarEvent, RecurrenceType } from '@/lib/store';
import { formatDate, parseDate } from '@/lib/calendar';
import { getEventsForDate } from '@/lib/calendar/recurrence';

/**
 * Input type for creating a new event (without id)
 */
export interface EventInput {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  recurrence?: RecurrenceType;
  type: 'event' | 'task';
}

/**
 * Storage key for calendar events in localStorage
 */
const STORAGE_KEY = 'calendar-events';

/**
 * Get all events from localStorage (internal helper)
 */
async function loadEventsFromStorage(): Promise<CalendarEvent[]> {
  return new Promise((resolve) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const events = JSON.parse(stored) as CalendarEvent[];
        // Validate and ensure dates are strings
        const validEvents = events.map(event => ({
          ...event,
          date: event.date, // Ensure date is string
        }));
        resolve(validEvents);
      } else {
        resolve([]);
      }
    } catch (error) {
      console.error('Error reading events from localStorage:', error);
      resolve([]);
    }
  });
}

/**
 * Save all events to localStorage
 */
async function saveAllEvents(events: CalendarEvent[]): Promise<void> {
  return new Promise((resolve) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      resolve();
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
      resolve();
    }
  });
}

/**
 * Get events for a date range
 * Includes recurring events that fall within the range
 */
export async function getEventsForRange(
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  const allEvents = await loadEventsFromStorage();
  const eventsInRange: CalendarEvent[] = [];
  const seenEventKeys = new Set<string>();
  
  // Iterate through each day in the range
  const currentDate = new Date(start);
  currentDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    const dayEvents = getEventsForDate(dateStr, allEvents);
    
    // Add events for this day, avoiding duplicates
    dayEvents.forEach(event => {
      // Create a unique key: original event ID + date
      // For recurring events, this allows multiple instances of the same event
      const eventKey = `${event.id}-${dateStr}`;
      
      if (!seenEventKeys.has(eventKey)) {
        seenEventKeys.add(eventKey);
        
        // For recurring events on dates other than the original, create a virtual instance
        if (event.recurrence && event.date !== dateStr) {
          eventsInRange.push({
            ...event,
            date: dateStr,
            // Keep original ID for reference, but mark as recurring instance
            id: event.id, // Keep original ID to maintain relationship
          });
        } else {
          eventsInRange.push(event);
        }
      }
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Sort by date and time
  return eventsInRange.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    
    // If same date, sort by time
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });
}

/**
 * Create a new event
 */
export async function createEvent(eventInput: EventInput): Promise<CalendarEvent> {
  const newEvent: CalendarEvent = {
    id: crypto.randomUUID(),
    ...eventInput,
  };
  
  const allEvents = await loadEventsFromStorage();
  const updatedEvents = [...allEvents, newEvent];
  await saveAllEvents(updatedEvents);
  
  return newEvent;
}

/**
 * Update an existing event
 */
export async function updateEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const allEvents = await loadEventsFromStorage();
  const eventIndex = allEvents.findIndex(e => e.id === id);
  
  if (eventIndex === -1) {
    throw new Error(`Event with id ${id} not found`);
  }
  
  const updatedEvent: CalendarEvent = {
    ...allEvents[eventIndex],
    ...updates,
    id, // Ensure id cannot be changed
  };
  
  const updatedEvents = [...allEvents];
  updatedEvents[eventIndex] = updatedEvent;
  await saveAllEvents(updatedEvents);
  
  return updatedEvent;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  const allEvents = await loadEventsFromStorage();
  const filteredEvents = allEvents.filter(e => e.id !== id);
  
  if (filteredEvents.length === allEvents.length) {
    throw new Error(`Event with id ${id} not found`);
  }
  
  await saveAllEvents(filteredEvents);
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const allEvents = await loadEventsFromStorage();
  return allEvents.find(e => e.id === id) || null;
}

/**
 * Get all events (for sync/backup purposes)
 */
export async function getAllEvents(): Promise<CalendarEvent[]> {
  return loadEventsFromStorage();
}

/**
 * Clear all events (useful for testing/reset)
 */
export async function clearAllEvents(): Promise<void> {
  return new Promise((resolve) => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      resolve();
    } catch (error) {
      console.error('Error clearing events from localStorage:', error);
      resolve();
    }
  });
}

