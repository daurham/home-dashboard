import { formatDate, getEventsForDate } from '@/lib/calendar';
import { CalendarEvent, useCalendarStore, useDashboardStore, usePreferencesStore } from '@/lib/store';
import { formatTimeString } from '@/lib/utils/timeFormat';
import { cn } from '@/lib/utils';

interface CalendarDayProps {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isWeekend: boolean;
  onClick: (date: Date) => void;
}

export function CalendarDay({ date, events, isToday, isWeekend, onClick }: CalendarDayProps) {
  const dateStr = formatDate(date);
  const dayEvents = getEventsForDate(dateStr, events);
  const { setSelectedEvent } = useCalendarStore();
  const { config } = useDashboardStore();
  const { timeFormat } = usePreferencesStore();
  
  const eventColor = config.calendar.eventColor;
  const taskColor = config.calendar.taskColor;
  
  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation(); // Prevent day click
    setSelectedEvent(event);
  };
  
  return (
    <button
      onClick={() => onClick(date)}
      className={cn(
        'relative min-h-[120px] p-3 pt-8 text-left transition-colors hover:bg-accent/50',
        'border-r border-border last:border-r-0',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        isWeekend && 'bg-calendar-weekend',
        isToday && 'ring-2 ring-calendar-today'
      )}
    >
      <div
        className={cn(
          'absolute top-2 left-2 text-sm font-semibold',
          isToday && 'text-calendar-today'
        )}
      >
        {date.getDate()}
      </div>
      <div className="space-y-1">
        {dayEvents.slice(0, 3).map((event) => {
          const isEvent = event.type === 'event';
          const customColor = isEvent ? eventColor : taskColor;
          const style = customColor ? { backgroundColor: `hsl(${customColor})` } : undefined;
          
          // Use composite key to ensure uniqueness across different days for recurring events
          const uniqueKey = `${event.id}-${dateStr}`;
          
          return (
            <div
              key={uniqueKey}
              onClick={(e) => handleEventClick(e, event)}
              className={cn(
                'text-xs px-2 py-1 rounded truncate cursor-pointer text-white',
                'hover:opacity-80 transition-opacity',
                !customColor && (isEvent ? 'bg-calendar-event' : 'bg-calendar-task')
              )}
              style={style}
            >
              {event.time && `${formatTimeString(event.time, timeFormat)} `}
              {event.title}
            </div>
          );
        })}
        {dayEvents.length > 3 && (
          <div className="text-xs text-muted-foreground px-2">
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    </button>
  );
}

