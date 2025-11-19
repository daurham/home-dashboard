import { CalendarEvent } from '@/lib/store';

/**
 * Calendar service for date calculations and event management.
 */
export class CalendarService {
  /**
   * Get the start of a week (Monday) for a given date
   */
  static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    return new Date(d.setDate(diff));
  }
  
  /**
   * Get an array of dates for a given week
   */
  static getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }
  
  /**
   * Get the four weeks to display: previous, current, next, and following
   */
  static getFourWeeks(currentDate: Date): Date[][] {
    const currentWeekStart = this.getWeekStart(currentDate);
    const weeks: Date[][] = [];
    
    // Previous week
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(currentWeekStart.getDate() - 7);
    weeks.push(this.getWeekDates(prevWeekStart));
    
    // Current week
    weeks.push(this.getWeekDates(currentWeekStart));
    
    // Next week
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    weeks.push(this.getWeekDates(nextWeekStart));
    
    // Following week
    const followingWeekStart = new Date(currentWeekStart);
    followingWeekStart.setDate(currentWeekStart.getDate() + 14);
    weeks.push(this.getWeekDates(followingWeekStart));
    
    return weeks;
  }
  
  /**
   * Format date to YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2);
  }
  
  /**
   * Check if a date is today
   */
  static isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }
  
  /**
   * Check if a date is a weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }
  
  /**
   * Get events for a specific date, including recurring events
   */
  static getEventsForDate(date: string, allEvents: CalendarEvent[]): CalendarEvent[] {
    return allEvents.filter(event => {
      if (event.date === date) return true;
      
      if (event.recurrence) {
        const eventDate = new Date(event.date);
        const targetDate = new Date(date);
        
        // Only show recurring events for dates after the original event
        if (targetDate < eventDate) return false;
        
        switch (event.recurrence) {
          case 'daily':
            return true;
          case 'weekly':
            return eventDate.getDay() === targetDate.getDay();
          case 'monthly':
            return eventDate.getDate() === targetDate.getDate();
          default:
            return false;
        }
      }
      
      return false;
    });
  }
}
