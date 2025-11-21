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
        'relative min-h-[80px] md:min-h-[120px] p-2 md:p-3 pt-6 md:pt-8 text-left transition-colors hover:bg-accent/50',
        'border-r border-border last:border-r-0',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        isWeekend && 'bg-calendar-weekend',
        isToday && 'ring-2 ring-calendar-today'
      )}
    >
      <div
        className={cn(
          'absolute top-1 left-1 md:top-2 md:left-2 text-xs md:text-sm font-semibold',
          isToday && 'text-calendar-today'
        )}
      >
        {date.getDate()}
      </div>
      <div className="space-y-0.5 md:space-y-1">
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
                'px-1 md:px-1.5 py-0.5 rounded cursor-pointer text-white',
                'hover:opacity-80 transition-opacity',
                'text-[9px] sm:text-[10px] md:text-[11px] leading-tight',
                'w-full',
                !customColor && (isEvent ? 'bg-calendar-event' : 'bg-calendar-task')
              )}
              style={style}
            >
              <div className="flex items-start gap-0.5 md:gap-1 w-full overflow-hidden">
                {event.time && (
                  <span className="whitespace-nowrap flex-shrink-0 text-[8px] sm:text-[9px] md:text-[10px]">
                    {formatTimeString(event.time, timeFormat)}
                  </span>
                )}
                <span 
                  className="whitespace-normal min-w-0 flex-1"
                  style={{ 
                    wordBreak: 'normal',
                    overflowWrap: 'normal'
                  }}
                >
                  {event.title}
                </span>
              </div>
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

