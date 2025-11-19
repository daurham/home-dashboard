import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'teal' | 'blue' | 'green' | 'orange' | 'purple';
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

export type SidebarTab = 'calendar' | 'devices' | 'security' | 'settings' | 'ai';

interface AppState {
  // Theme state
  themeMode: ThemeMode;
  accentColor: AccentColor;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  
  // Sidebar state
  activeSidebarTab: SidebarTab;
  sidebarCollapsed: boolean;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Calendar state
  events: CalendarEvent[];
  selectedDate: string | null;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme defaults
      themeMode: 'light',
      accentColor: 'teal',
      setThemeMode: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      
      // Sidebar defaults
      activeSidebarTab: 'calendar',
      sidebarCollapsed: false,
      setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Calendar defaults
      events: [],
      selectedDate: null,
      addEvent: (event) => set((state) => ({ 
        events: [...state.events, event] 
      })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id)
      })),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'home-dashboard-storage',
    }
  )
);
