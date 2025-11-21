import { useState, useMemo, useEffect } from 'react';
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
  const { events, setSelectedDate, loadEvents } = useCalendarStore();
  const { config } = useDashboardStore();
  const firstDayOfWeek = config.calendar.firstDayOfWeek;
  
  // Load events when component mounts or date range changes
  useEffect(() => {
    // Calculate date range for the visible weeks (4 weeks)
    const weeks = getFourWeeks(currentDate, firstDayOfWeek);
    const startDate = weeks[0][0];
    const endDate = weeks[weeks.length - 1][6];
    
    // Load events for the visible range
    loadEvents(startDate, endDate);
  }, [currentDate, firstDayOfWeek, loadEvents]);
  
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
  
  // Format today's date for display: "Thursday, Nov 20 2025"
  const formatCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return today.toLocaleDateString('en-US', options);
  };
  
  return (
    <div className="space-y-2 md:space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground">
          {formatCurrentDate()}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="h-8 px-3 md:h-9 md:px-4 text-xs md:text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            className="h-8 w-8 md:h-9 md:w-9"
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
              className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-muted-foreground"
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

