import { formatDate, parseDate } from '@/lib/calendar';
import { getEventsForDate } from '@/lib/calendar/recurrence';
import { calendarApi } from './apiService';

// Export types for use in stores
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | null;

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  recurrence?: RecurrenceType;
  type: 'event' | 'task';
}

/**
 * Convert database calendar event to frontend format
 */
function dbEventToFrontend(dbEvent: any): CalendarEvent {
  const startTime = new Date(dbEvent.start_time);
  const date = formatDate(startTime);
  const time = startTime.toTimeString().slice(0, 5); // HH:MM
  
  // Extract recurrence from recurrence_rule JSONB
  let recurrence: RecurrenceType = null;
  if (dbEvent.recurrence_rule) {
    const rule = typeof dbEvent.recurrence_rule === 'string' 
      ? JSON.parse(dbEvent.recurrence_rule) 
      : dbEvent.recurrence_rule;
    recurrence = rule.freq || null;
  }
  
  // Extract type from metadata
  const metadata = dbEvent.metadata 
    ? (typeof dbEvent.metadata === 'string' ? JSON.parse(dbEvent.metadata) : dbEvent.metadata)
    : {};
  const type = metadata.type || 'event';

  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description || undefined,
    date,
    time,
    recurrence,
    type: type as 'event' | 'task',
  };
}

/**
 * Convert frontend calendar event to database format
 */
function frontendEventToDb(event: CalendarEvent | Omit<CalendarEvent, 'id'>): any {
  // Combine date and time into start_time
  const dateTimeStr = event.time 
    ? `${event.date}T${event.time}:00`
    : `${event.date}T00:00:00`;
  const startTime = new Date(dateTimeStr).toISOString();
  
  // Calculate end_time (default to 1 hour after start if no time specified)
  let endTime: string | null = null;
  if (event.time) {
    const end = new Date(dateTimeStr);
    end.setHours(end.getHours() + 1);
    endTime = end.toISOString();
  }

  // Build recurrence_rule
  const recurrenceRule = event.recurrence 
    ? { freq: event.recurrence }
    : null;

  // Build metadata
  const metadata = {
    type: event.type || 'event',
  };

  return {
    title: event.title,
    description: event.description || null,
    start_time: startTime,
    end_time: endTime,
    recurrence_rule: recurrenceRule,
    metadata,
    module_instance_id: null, // Can be set if needed
  };
}

/**
 * Get events for a date range
 * Includes recurring events that fall within the range
 */
export async function getEventsForRange(
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  try {
    // Fetch events from database
    const dbEvents = await calendarApi.getByRange(start.toISOString(), end.toISOString());
    
    // Convert to frontend format
    const frontendEvents = dbEvents.map(dbEventToFrontend);
    
    // Handle recurring events that fall within the range
    const eventsInRange: CalendarEvent[] = [];
    const seenEventKeys = new Set<string>();
    
    // Iterate through each day in the range
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayEvents = getEventsForDate(dateStr, frontendEvents);
      
      // Add events for this day, avoiding duplicates
      dayEvents.forEach(event => {
        const eventKey = `${event.id}-${dateStr}`;
        
        if (!seenEventKeys.has(eventKey)) {
          seenEventKeys.add(eventKey);
          
          // For recurring events on dates other than the original, create a virtual instance
          if (event.recurrence && event.date !== dateStr) {
            eventsInRange.push({
              ...event,
              date: dateStr,
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
      
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  } catch (error) {
    console.error('Error fetching events from API:', error);
    // Fallback to empty array on error
    return [];
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventInput: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  try {
    const dbData = frontendEventToDb(eventInput);
    const dbEvent = await calendarApi.create(dbData);
    return dbEventToFrontend(dbEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  try {
    // Get current event
    const currentEvent = await getEventById(id);
    if (!currentEvent) {
      throw new Error(`Event with id ${id} not found`);
    }

    // Merge updates
    const updatedEvent = { ...currentEvent, ...updates };
    const dbData = frontendEventToDb(updatedEvent);
    
    const dbEvent = await calendarApi.update(id, dbData);
    return dbEventToFrontend(dbEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  try {
    await calendarApi.delete(id);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string): Promise<CalendarEvent | null> {
  try {
    const dbEvent = await calendarApi.getById(id);
    return dbEventToFrontend(dbEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

/**
 * Get all events (for sync/backup purposes)
 */
export async function getAllEvents(): Promise<CalendarEvent[]> {
  try {
    const dbEvents = await calendarApi.getAll();
    return dbEvents.map(dbEventToFrontend);
  } catch (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
}

/**
 * Clear all events (useful for testing/reset)
 */
export async function clearAllEvents(): Promise<void> {
  try {
    const events = await getAllEvents();
    await Promise.all(events.map(event => deleteEvent(event.id)));
  } catch (error) {
    console.error('Error clearing events:', error);
    throw error;
  }
}
