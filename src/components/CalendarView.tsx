import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CalendarService } from '@/services/calendarService';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { events, setSelectedDate } = useStore();
  
  const weeks = CalendarService.getFourWeeks(currentDate);
  const currentWeekStart = CalendarService.getWeekStart(new Date());
  
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  
  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };
  
  const handleDayClick = (date: Date) => {
    setSelectedDate(CalendarService.formatDate(date));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Calendar</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="h-9"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden bg-card">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar weeks */}
        {weeks.map((week, weekIndex) => {
          const isCurrentWeek = CalendarService.isSameDay(week[0], currentWeekStart);
          
          return (
            <div
              key={weekIndex}
              className={cn(
                'grid grid-cols-7 border-b border-border last:border-b-0',
                isCurrentWeek && 'bg-calendar-today-bg'
              )}
            >
              {week.map((date, dayIndex) => {
                const dateStr = CalendarService.formatDate(date);
                const dayEvents = CalendarService.getEventsForDate(dateStr, events);
                const isToday = CalendarService.isToday(date);
                const isWeekend = CalendarService.isWeekend(date);
                
                return (
                  <button
                    key={dayIndex}
                    onClick={() => handleDayClick(date)}
                    className={cn(
                      'min-h-[120px] p-3 text-left transition-colors hover:bg-accent/50',
                      'border-r border-border last:border-r-0',
                      'focus:outline-none focus:ring-2 focus:ring-ring',
                      isWeekend && 'bg-calendar-weekend',
                      isToday && 'ring-2 ring-calendar-today'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-semibold mb-2',
                        isToday && 'text-calendar-today'
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs px-2 py-1 rounded truncate',
                            event.type === 'event'
                              ? 'bg-calendar-event text-white'
                              : 'bg-calendar-task text-white'
                          )}
                        >
                          {event.time && `${event.time} `}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground px-2">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
