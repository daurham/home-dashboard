import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HubCard } from '@/components/home/HubCard';
import { useCalendarStore, useDashboardStore, usePreferencesStore, useUIStore } from '@/lib/store';
import { mergeChoresIntoEvents, isChoreEventId, useChoreStore } from '@/lib/store/choreStore';
import {
  calendarKeyStep,
  formatDate,
  formatMonthYear,
  getMonthEnd,
  getMonthStart,
  getWeekDates,
  getWeekStart,
  isToday,
  parseDate,
  shiftDate,
  shiftMonthKeepingDay,
  shiftWeek,
} from '@/lib/calendar';
import { getEventsForDate } from '@/lib/calendar/recurrence';
import { formatTimeString } from '@/lib/utils/timeFormat';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/services/calendarService';

function monthGrid(date: Date, firstDayOfWeek: 0 | 1): Date[][] {
  const start = getWeekStart(getMonthStart(date), firstDayOfWeek);
  const end = getMonthEnd(date);
  const weeks: Date[][] = [];
  let cursor = new Date(start);
  while (cursor <= end || weeks.length < 5) {
    weeks.push(getWeekDates(cursor));
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
    if (weeks.length >= 6) break;
  }
  if (weeks[weeks.length - 1]?.every((day) => day.getMonth() !== date.getMonth()) && weeks.length > 5) {
    weeks.pop();
  }
  return weeks;
}

function eventDotClass(title: string, type: 'event' | 'task', chore = false): string {
  if (chore) return 'bg-amber-500';
  if (/family|birthday|anniversary|mia/i.test(title)) return 'bg-violet-500';
  if (type === 'task') return 'bg-amber-500';
  return 'bg-emerald-500';
}

function agendaDate(day: Date): string {
  return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function upcomingFrom(start: Date, events: CalendarEvent[], limit = 3) {
  const items: Array<{ day: Date; event: CalendarEvent }> = [];
  for (let offset = 0; offset < 14 && items.length < limit; offset += 1) {
    const day = shiftDate(start, offset);
    const dayEvents = [...getEventsForDate(formatDate(day), events)].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    for (const event of dayEvents) {
      items.push({ day, event });
      if (items.length >= limit) break;
    }
  }
  return items;
}

function eventKind(event: CalendarEvent): string {
  if (isChoreEventId(event.id)) return 'Chore';
  if (event.type === 'task') return 'Task';
  return 'Event';
}

export function MonthCalendarCard({ compact = false, wide = false }: { compact?: boolean; wide?: boolean }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusDate, setFocusDate] = useState(() => formatDate(new Date()));
  const [pendingCellFocus, setPendingCellFocus] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { events, loadEvents, setSelectedDate, setSelectedEvent } = useCalendarStore();
  const chores = useChoreStore((s) => s.chores);
  const firstDayOfWeek = useDashboardStore((s) => s.config.calendar.firstDayOfWeek);
  const timeFormat = usePreferencesStore((s) => s.timeFormat);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const weekDays = firstDayOfWeek === 0
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const weeks = useMemo(() => monthGrid(currentDate, firstDayOfWeek), [currentDate, firstDayOfWeek]);
  const currentWeek = useMemo(
    () => getWeekDates(getWeekStart(currentDate, firstDayOfWeek)),
    [currentDate, firstDayOfWeek],
  );
  const visibleEvents = useMemo(() => {
    const start = compact
      ? shiftDate(new Date(), -1)
      : weeks[0]?.[0] ?? shiftDate(new Date(), -1);
    const end = compact
      ? shiftDate(new Date(), 21)
      : weeks[weeks.length - 1]?.[6] ?? shiftDate(new Date(), 21);
    return mergeChoresIntoEvents(events, chores, start, end);
  }, [chores, compact, events, weeks]);
  const agenda = useMemo(
    () => upcomingFrom(new Date(), visibleEvents, wide ? 8 : compact ? 3 : 4),
    [compact, visibleEvents, wide],
  );
  const gridDays = useMemo(() => weeks.flat(), [weeks]);
  // The month on screen always owns the selection, so a cell is always reachable by Tab.
  const activeDate = useMemo(() => {
    if (gridDays.some((day) => formatDate(day) === focusDate)) return focusDate;
    const firstOfMonth = gridDays.find((day) => day.getMonth() === currentDate.getMonth());
    return formatDate(firstOfMonth ?? gridDays[0] ?? new Date());
  }, [currentDate, focusDate, gridDays]);
  const focusedEvents = useMemo(
    () => [...getEventsForDate(activeDate, visibleEvents)].sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [activeDate, visibleEvents],
  );
  const focusedDay = parseDate(activeDate);

  useEffect(() => {
    if (compact) {
      const start = shiftDate(new Date(), -1);
      const end = shiftDate(new Date(), 21);
      void loadEvents(start, end);
      return;
    }
    const start = weeks[0]?.[0];
    const end = weeks[weeks.length - 1]?.[6];
    if (start && end) void loadEvents(start, end);
  }, [compact, currentDate, firstDayOfWeek, loadEvents, weeks]);

  // Arrow keys move the selection, so DOM focus has to follow it across month changes.
  useEffect(() => {
    if (!pendingCellFocus) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${pendingCellFocus}"]`)?.focus();
    setPendingCellFocus(null);
  }, [pendingCellFocus]);

  const openDay = (day: Date) => {
    setFocusDate(formatDate(day));
    if (wide) return;
    setSelectedDate(formatDate(day));
    setActiveSidebarTab('calendar');
  };

  const openCreate = (day: Date) => {
    setSelectedEvent(null);
    setSelectedDate(formatDate(day));
  };

  /** Wide: first click selects the day, a second click on it starts a new entry. */
  const pickDay = (day: Date) => {
    if (!wide) {
      openDay(day);
      return;
    }
    if (formatDate(day) === activeDate) {
      openCreate(day);
      return;
    }
    setFocusDate(formatDate(day));
    if (day.getMonth() !== currentDate.getMonth()) setCurrentDate(day);
  };

  /** Month nav keeps the selection on the same day of the month so it stays on screen. */
  const goToMonth = (delta: number) => {
    const nextMonth = shiftMonthKeepingDay(currentDate, delta);
    const focused = parseDate(activeDate);
    const monthsApart =
      (nextMonth.getFullYear() - focused.getFullYear()) * 12 + (nextMonth.getMonth() - focused.getMonth());
    setCurrentDate(nextMonth);
    setFocusDate(formatDate(shiftMonthKeepingDay(focused, monthsApart)));
  };

  const focusCell = (day: Date) => {
    const date = formatDate(day);
    setFocusDate(date);
    setPendingCellFocus(date);
    if (day.getMonth() !== currentDate.getMonth() || day.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(day);
    }
  };

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = calendarKeyStep(parseDate(activeDate), event.key);
    if (step) {
      event.preventDefault();
      focusCell(step);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const day = parseDate(activeDate);
      if (wide) openCreate(day);
      else openDay(day);
    }
  };

  const monthPane = (
    <>
      <div className={cn('grid grid-cols-7 text-center font-medium text-muted-foreground', wide ? 'text-xs' : 'text-[10px]')}>
        {weekDays.map((day, index) => (
          <div key={`${day}-${index}`} className={cn(wide ? 'py-1' : 'py-0.5')}>{day}</div>
        ))}
      </div>
      <div
        ref={gridRef}
        role="grid"
        aria-label="Month"
        onKeyDown={handleGridKeyDown}
        className="grid min-h-0 flex-1 grid-cols-7 focus:outline-none"
      >
        {gridDays.map((day) => {
          const inMonth = day.getMonth() === currentDate.getMonth();
          const dayEvents = getEventsForDate(formatDate(day), visibleEvents);
          const selected = formatDate(day) === activeDate;
          return (
            <button
              key={formatDate(day)}
              type="button"
              role="gridcell"
              data-day={formatDate(day)}
              tabIndex={selected ? 0 : -1}
              aria-selected={selected}
              aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              title={selected && wide ? 'Click again to add an event or task' : undefined}
              onClick={() => pickDay(day)}
              className={cn(
                'flex min-h-0 flex-col items-center justify-center rounded-md hover:bg-muted/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                wide ? 'text-sm' : 'text-xs',
                !inMonth && 'text-muted-foreground/50',
                selected && wide && 'bg-muted',
                selected && !wide && 'ring-1 ring-foreground/25',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full',
                  wide ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-[12px]',
                  isToday(day) && 'bg-foreground text-background',
                  selected && wide && !isToday(day) && 'ring-1 ring-foreground/40',
                )}
              >
                {day.getDate()}
              </span>
              <span className={cn('flex items-center gap-px', wide ? 'h-2.5' : 'h-2')}>
                {dayEvents.slice(0, 3).map((event) => (
                  <span key={event.id} className={cn('h-1.5 w-1.5 rounded-full', eventDotClass(event.title, event.type, isChoreEventId(event.id)))} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  if (compact) {
    return (
      <HubCard className="p-2">
        <div className="mb-1 flex items-center justify-between gap-1">
          <h2 className="text-[11px] font-semibold">Calendar</h2>
          <div className="flex items-center gap-0.5">
            <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => setCurrentDate(shiftWeek(currentDate, -1))} aria-label="Previous week">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <p className="min-w-[5.5rem] text-center text-[11px] font-medium">{formatMonthYear(currentDate)}</p>
            <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => setCurrentDate(shiftWeek(currentDate, 1))} aria-label="Next week">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="ml-1 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setActiveSidebarTab('calendar')}>
              All
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-7 gap-1">
          {currentWeek.map((day, index) => {
            const dayEvents = getEventsForDate(formatDate(day), visibleEvents);
            const today = isToday(day);
            return (
              <button
                key={formatDate(day)}
                type="button"
                onClick={() => openDay(day)}
                className={cn(
                  'flex min-h-0 flex-col items-center justify-center rounded-lg px-0.5 hover:bg-muted/70',
                  today && 'bg-foreground text-background hover:bg-foreground',
                )}
              >
                <span className={cn('text-[9px] font-medium leading-none', today ? 'text-background/70' : 'text-muted-foreground')}>
                  {weekDays[index]}
                </span>
                <span className="text-sm font-semibold leading-tight">{day.getDate()}</span>
                <span className="mt-0.5 flex min-h-[6px] items-center gap-px">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className={cn('h-1.5 w-1.5 rounded-full', today ? 'bg-background' : eventDotClass(event.title, event.type, isChoreEventId(event.id)))}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {agenda.length > 0 && (
          <ul className="mt-1.5 shrink-0 space-y-1">
            {agenda.map(({ day, event }) => (
              <li key={`${event.id}-${formatDate(day)}`}>
                <button
                  type="button"
                  onClick={() => openDay(day)}
                  className="flex w-full items-baseline gap-1.5 rounded px-0.5 text-left hover:bg-muted/50"
                >
                  <span className="w-12 shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                    {agendaDate(day)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium leading-tight">{event.title}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {event.time || (isChoreEventId(event.id) ? 'chore' : 'all day')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </HubCard>
    );
  }

  return (
    <HubCard className={wide ? 'p-4' : 'p-3'}>
      <div className={cn('flex items-center justify-between gap-2', wide ? 'mb-2' : 'mb-1')}>
        <h2 className={cn('font-semibold', wide ? 'text-base' : 'text-sm')}>Calendar</h2>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => goToMonth(-1)} aria-label="Previous month">
            <ChevronLeft className={wide ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          </button>
          <p className={cn('text-center font-medium', wide ? 'min-w-[8rem] text-sm' : 'min-w-[7rem] text-xs')}>{formatMonthYear(currentDate)}</p>
          <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => goToMonth(1)} aria-label="Next month">
            <ChevronRight className={wide ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          </button>
          <button type="button" className={cn('ml-1 text-muted-foreground hover:text-foreground', wide ? 'text-xs' : 'text-xs')} onClick={() => setActiveSidebarTab('calendar')}>
            All
          </button>
        </div>
      </div>

      <div className={cn('grid min-h-0 flex-1 gap-3', wide && 'md:grid-cols-[minmax(0,1.55fr)_minmax(13.5rem,0.7fr)]')}>
        <div className="flex min-h-0 min-w-0 flex-col">
          {monthPane}
          {!wide && (
            <div className="mt-2 shrink-0 border-t border-border/70 pt-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Upcoming</p>
              <ul className="space-y-1">
                {agenda.length === 0 && (
                  <li className="text-[11px] text-muted-foreground">No upcoming items.</li>
                )}
                {agenda.map(({ day, event }) => (
                  <li key={`${event.id}-${formatDate(day)}`}>
                    <button
                      type="button"
                      onClick={() => openDay(day)}
                      className="flex w-full items-baseline gap-1.5 rounded px-0.5 text-left hover:bg-muted/50"
                    >
                      <span className="w-12 shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {agendaDate(day)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium leading-tight">{event.title}</span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {event.time || (isChoreEventId(event.id) ? 'chore' : 'all day')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {wide && (
          <div className="flex min-h-0 min-w-0 flex-col border-border/70 max-md:border-t max-md:pt-3 md:border-l md:pl-4">
            <p className="text-sm font-semibold leading-tight">
              {focusedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {focusedEvents.length === 0 ? 'Nothing scheduled' : `${focusedEvents.length} on this day`}
            </p>
            <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
              {focusedEvents.map((event) => (
                <li key={event.id} className="rounded-lg bg-muted/40 px-2 py-1.5">
                  <div className="flex items-start gap-2">
                    <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', eventDotClass(event.title, event.type, isChoreEventId(event.id)))} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium leading-tight">{event.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {eventKind(event)}
                        {event.time ? ` · ${formatTimeString(event.time, timeFormat)}` : ' · All day'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-2 shrink-0 border-t border-border/70 pt-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Upcoming</p>
              <ul className="space-y-1">
                {agenda.length === 0 && (
                  <li className="text-[11px] text-muted-foreground">No upcoming items.</li>
                )}
                {agenda.map(({ day, event }) => (
                  <li key={`${event.id}-${formatDate(day)}`}>
                    <button
                      type="button"
                      onClick={() => openDay(day)}
                      className="flex w-full items-baseline gap-1.5 rounded px-0.5 text-left hover:bg-muted/50"
                    >
                      <span className="w-[4.25rem] shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {agendaDate(day)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium leading-tight">{event.title}</span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {event.time ? formatTimeString(event.time, timeFormat) : eventKind(event)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </HubCard>
  );
}
