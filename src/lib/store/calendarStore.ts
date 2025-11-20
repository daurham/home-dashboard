import { create } from 'zustand';
import * as calendarService from '@/services/calendarService';
import { CalendarEvent, RecurrenceType } from '@/services/calendarService';

// Re-export types for convenience
export type { CalendarEvent, RecurrenceType };

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string | null;
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedDate: (date: string | null) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  loadEvents: (startDate?: Date, endDate?: Date) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

// Default date range for loading events (current month ± 1 month)
function getDefaultDateRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return { start, end };
}

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  events: [],
  selectedDate: null,
  selectedEvent: null,
  isLoading: false,
  
  loadEvents: async (startDate?: Date, endDate?: Date) => {
    // Prevent multiple simultaneous loads
    if (get().isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const { start, end } = startDate && endDate 
        ? { start: startDate, end: endDate }
        : getDefaultDateRange();
      
      const events = await calendarService.getEventsForRange(start, end);
      set({ events, isLoading: false });
    } catch (error) {
      console.error('Error loading calendar events:', error);
      set({ events: [], isLoading: false });
    }
  },
  
  refreshEvents: async () => {
    await get().loadEvents();
  },
  
  addEvent: async (eventInput: Omit<CalendarEvent, 'id'>) => {
    try {
      // Create event in database
      const newEvent = await calendarService.createEvent(eventInput);
      
      // Update local state
      set((state) => ({
        events: [...state.events, newEvent]
      }));
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  },
  
  updateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      // Update event in database
      const updatedEvent = await calendarService.updateEvent(id, updates);
      
      // Update local state
      set((state) => ({
        events: state.events.map((e) => e.id === id ? updatedEvent : e)
      }));
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },
  
  deleteEvent: async (id: string) => {
    try {
      // Delete event from database
      await calendarService.deleteEvent(id);
      
      // Update local state
      set((state) => ({
        events: state.events.filter((e) => e.id !== id)
      }));
      
      // Clear selected event if it was deleted
      const currentSelected = get().selectedEvent;
      if (currentSelected && currentSelected.id === id) {
        set({ selectedEvent: null });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
  
  setSelectedDate: (date) => set({ selectedDate: date, selectedEvent: null }),
  setSelectedEvent: (event) => set({ selectedEvent: event, selectedDate: event?.date || null }),
}));
