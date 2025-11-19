import { isSameDay, isToday, isWeekend } from '@/lib/calendar';
import { CalendarEvent } from '@/lib/store';
import { CalendarDay } from './CalendarDay';
import { cn } from '@/lib/utils';

interface CalendarWeekProps {
  week: Date[];
  events: CalendarEvent[];
  currentWeekStart: Date;
  onDayClick: (date: Date) => void;
}

export function CalendarWeek({ week, events, currentWeekStart, onDayClick }: CalendarWeekProps) {
  const isCurrentWeek = isSameDay(week[0], currentWeekStart);
  
  return (
    <div
      className={cn(
        'grid grid-cols-7 border-b border-border last:border-b-0',
        isCurrentWeek && 'bg-calendar-today-bg'
      )}
    >
      {week.map((date, dayIndex) => {
        const isTodayDate = isToday(date);
        const isWeekendDate = isWeekend(date);
        
        return (
          <CalendarDay
            key={dayIndex}
            date={date}
            events={events}
            isToday={isTodayDate}
            isWeekend={isWeekendDate}
            onClick={onDayClick}
          />
        );
      })}
    </div>
  );
}

