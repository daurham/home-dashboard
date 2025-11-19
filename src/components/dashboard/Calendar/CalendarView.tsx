import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getFourWeeks, getWeekStart, formatDate, shiftWeek, formatMonthYear, isFirstDayOfMonth } from '@/lib/calendar';
import { useCalendarStore, useDashboardStore } from '@/lib/store';
import { CalendarWeek } from './CalendarWeek';

const weekDaysMonday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekDaysSunday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { events, setSelectedDate } = useCalendarStore();
  const { config } = useDashboardStore();
  const firstDayOfWeek = config.calendar.firstDayOfWeek;
  
  const weeks = getFourWeeks(currentDate, firstDayOfWeek);
  const currentWeekStart = getWeekStart(new Date(), firstDayOfWeek);
  const weekDays = firstDayOfWeek === 0 ? weekDaysSunday : weekDaysMonday;
  
  // Determine which weeks need month labels (weeks containing the 1st of a month)
  const weeksWithMonths = useMemo(() => {
    return weeks.map((week) => {
      const firstDayInWeek = week.find((date) => isFirstDayOfMonth(date));
      return firstDayInWeek ? formatMonthYear(firstDayInWeek) : null;
    });
  }, [weeks]);
  
  const handlePrevWeek = () => {
    setCurrentDate(shiftWeek(currentDate, -1));
  };
  
  const handleNextWeek = () => {
    setCurrentDate(shiftWeek(currentDate, 1));
  };
  
  const handleDayClick = (date: Date) => {
    setSelectedDate(formatDate(date));
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
          const monthLabel = weeksWithMonths[weekIndex];
          return (
            <div key={weekIndex}>
              {monthLabel && (
                <div className="px-3 py-2 border-b border-border bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">
                    {monthLabel}
                  </span>
                </div>
              )}
              <CalendarWeek
                week={week}
                events={events}
                currentWeekStart={currentWeekStart}
                onDayClick={handleDayClick}
              />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

