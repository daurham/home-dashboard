import { formatDate, getEventsForDate } from '@/lib/calendar';
import { CalendarEvent, useCalendarStore, useDashboardStore, usePreferencesStore } from '@/lib/store';
import { currentOccurrence, isChoreEventId, parseChoreEventId, useChoreStore } from '@/lib/store/choreStore';
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
  const chores = useChoreStore((s) => s.chores);
  const toggleComplete = useChoreStore((s) => s.toggleComplete);
  const { config } = useDashboardStore();
  const { timeFormat } = usePreferencesStore();
  
  const eventColor = config.calendar.eventColor;
  const taskColor = config.calendar.taskColor;
  
  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (isChoreEventId(event.id)) {
      const parsed = parseChoreEventId(event.id);
      const chore = parsed ? chores.find((item) => item.id === parsed.choreId) : undefined;
      // Completions are always recorded on today, whether the slot is overdue or still upcoming.
      if (parsed && chore && (parsed.date === formatDate(new Date()) || parsed.date === currentOccurrence(chore))) {
        toggleComplete(chore.id);
      }
      return;
    }
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
          const isChore = isChoreEventId(event.id);
          const isEvent = event.type === 'event';
          const customColor = isChore ? undefined : isEvent ? eventColor : taskColor;
          const style = customColor ? { backgroundColor: `hsl(${customColor})` } : undefined;
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
                isChore && 'bg-amber-600',
                !isChore && !customColor && (isEvent ? 'bg-calendar-event' : 'bg-calendar-task')
              )}
              style={style}
              title={isChore ? event.description : event.title}
            >
              <div className="flex items-start gap-0.5 md:gap-1 w-full overflow-hidden">
                {event.time && !isChore && (
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

