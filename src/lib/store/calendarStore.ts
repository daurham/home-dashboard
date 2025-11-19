import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string | null;
  selectedEvent: CalendarEvent | null;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      selectedDate: null,
      selectedEvent: null,
      addEvent: (event) => set((state) => ({ 
        events: [...state.events, event] 
      })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id)
      })),
      setSelectedDate: (date) => set({ selectedDate: date, selectedEvent: null }),
      setSelectedEvent: (event) => set({ selectedEvent: event, selectedDate: event?.date || null }),
    }),
    {
      name: 'calendar-storage',
    }
  )
);

