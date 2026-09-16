import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LayoutGrid, RotateCcw } from 'lucide-react';
import { HomeHeader, HomeFooter } from '@/components/home/HomeHeader';
import { HomeGrid } from '@/components/home/HomeGrid';
import { StatCards } from '@/components/home/StatCards';
import { ExpenseLoggerCard } from '@/components/home/ExpenseLoggerCard';
import { RecurringChoresCard } from '@/components/home/RecurringChoresCard';
import { HabitTrackerCard } from '@/components/home/HabitTrackerCard';
import { MonthCalendarCard } from '@/components/home/MonthCalendarCard';
import { CameraGridCard } from '@/components/home/CameraGridCard';
import { LatencyTrackerCard } from '@/components/home/LatencyTrackerCard';
import { Button } from '@/components/ui/button';
import { useCalendarStore } from '@/lib/store/calendarStore';
import { useExpenseStore } from '@/lib/store/expenseStore';
import { getChoreStatus, useChoreStore } from '@/lib/store/choreStore';
import { useHomeLayoutStore, usePreferencesStore } from '@/lib/store';
import { cameras } from '@/config/cameras';
import { formatDate } from '@/lib/calendar';
import { getEventsForDate } from '@/lib/calendar/recurrence';
import { getExpenseMonthRange, todayYmd } from '@/lib/expenses/weekRange';
import { DEFAULT_WEEKLY_BUDGET_CENTS } from '@/lib/expenses/constants';
import { getExpenseSummary } from '@/services/expenseService';
import type { HomeModuleId } from '@/lib/home/layout';

export function HomeDashboard() {
  const expenseTimeZone = usePreferencesStore((s) => s.expenseTimeZone);
  const loadExpenses = useExpenseStore((s) => s.load);
  const setGrain = useExpenseStore((s) => s.setGrain);
  const grain = useExpenseStore((s) => s.grain);
  const summary = useExpenseStore((s) => s.summary);
  const events = useCalendarStore((s) => s.events);
  const calendarLoaded = useCalendarStore((s) => s.hasLoaded);
  const loadEvents = useCalendarStore((s) => s.loadEvents);
  const chores = useChoreStore((s) => s.chores);
  const choresLoaded = useChoreStore((s) => s.hasLoaded);
  const expensesLoaded = useExpenseStore((s) => s.hasLoaded);
  const editing = useHomeLayoutStore((s) => s.editing);
  const scales = useHomeLayoutStore((s) => s.scales);
  const setEditing = useHomeLayoutStore((s) => s.setEditing);
  const resetLayout = useHomeLayoutStore((s) => s.resetLayout);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [monthSpend, setMonthSpend] = useState(0);
  const [vsPriorPercent, setVsPriorPercent] = useState<number | null>(null);
  const [monthLoaded, setMonthLoaded] = useState(false);

  const markSynced = useCallback((at = new Date()) => {
    setLastSynced(at);
  }, []);

  useEffect(() => {
    if (grain !== 'week') {
      setGrain('week');
      return;
    }
    void loadExpenses(expenseTimeZone)
      .then(() => markSynced())
      .catch(() => undefined);
  }, [expenseTimeZone, grain, loadExpenses, markSynced, setGrain]);

  useEffect(() => {
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    const end = new Date();
    end.setMonth(end.getMonth() + 2);
    end.setDate(0);
    void loadEvents(start, end).then(() => markSynced());
  }, [loadEvents, markSynced]);

  useEffect(() => {
    const month = getExpenseMonthRange(todayYmd(expenseTimeZone), expenseTimeZone);
    void getExpenseSummary({
      grain: 'month',
      month: month.monthKey,
      timeZone: expenseTimeZone,
    })
      .then((monthSummary) => {
        setMonthSpend(monthSummary.selectedPeriodTotalCents);
        const current = monthSummary.periods.find((period) => period.key === month.monthKey);
        const index = monthSummary.periods.findIndex((period) => period.key === month.monthKey);
        const prior = index > 0 ? monthSummary.periods[index - 1] : null;
        if (current && prior && prior.totalCents > 0) {
          setVsPriorPercent(((current.totalCents - prior.totalCents) / prior.totalCents) * 100);
        } else {
          setVsPriorPercent(null);
        }
        markSynced();
        setMonthLoaded(true);
      })
      .catch(() => setMonthLoaded(true));
  }, [expenseTimeZone, markSynced]);

  const today = formatDate(new Date());
  const todayEvents = getEventsForDate(today, events);
  const nextEvent = [...todayEvents].sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
  const nextEventLabel = nextEvent
    ? `${nextEvent.title}${nextEvent.time ? ` ${nextEvent.time}` : ''}`
    : null;

  const choreStatuses = chores.map((chore) => getChoreStatus(chore));
  const choresDueToday = choreStatuses.filter((status) => status.tone === 'today').length;
  const choresCompletedToday = chores.filter((chore) => chore.lastCompletedOn === today).length;

  const modules = useMemo<Record<HomeModuleId, ReactNode>>(() => ({
    stats: (
      <StatCards
        monthSpendCents={monthSpend}
        vsPriorPercent={vsPriorPercent}
        weeklySpentCents={summary?.selectedPeriodTotalCents ?? 0}
        weeklyBudgetCents={summary?.weeklyBudgetCents ?? DEFAULT_WEEKLY_BUDGET_CENTS}
        choresDueToday={choresDueToday}
        choresCompletedToday={choresCompletedToday}
        eventsToday={todayEvents.length}
        nextEventLabel={nextEventLabel}
        camerasOnline={cameras.length}
        camerasTotal={cameras.length}
        compact={scales.stats === 'compact'}
        loading={!expensesLoaded || !choresLoaded || !calendarLoaded || !monthLoaded}
      />
    ),
    expenses: <ExpenseLoggerCard compact={scales.expenses === 'compact'} />,
    chores: <RecurringChoresCard compact={scales.chores === 'compact'} />,
    habits: <HabitTrackerCard compact={scales.habits === 'compact'} />,
    calendar: <MonthCalendarCard compact={scales.calendar === 'compact'} wide={scales.calendar === 'wide'} />,
    latency: <LatencyTrackerCard onSynced={markSynced} compact={scales.latency === 'compact'} />,
    cameras: <CameraGridCard />,
  }), [
    calendarLoaded,
    cameras.length,
    choresCompletedToday,
    choresDueToday,
    choresLoaded,
    expensesLoaded,
    markSynced,
    monthSpend,
    nextEventLabel,
    scales.calendar,
    scales.chores,
    scales.expenses,
    scales.habits,
    scales.latency,
    scales.stats,
    summary?.selectedPeriodTotalCents,
    summary?.weeklyBudgetCents,
    todayEvents.length,
    vsPriorPercent,
    monthLoaded,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden max-md:h-auto max-md:overflow-visible">
      <HomeHeader
        actions={(
          <div className="flex items-center gap-1.5">
            {editing && (
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetLayout}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
            <Button
              type="button"
              variant={editing ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => setEditing(!editing)}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {editing ? 'Done' : 'Customize'}
            </Button>
          </div>
        )}
      />
      {editing && (
        <p className="shrink-0 text-[11px] text-muted-foreground">
          Drag handles to rearrange. Shrink for half height, and the two-column icon expands Calendar to two modules.
        </p>
      )}
      <HomeGrid modules={modules} />
      <HomeFooter lastSynced={lastSynced} />
    </div>
  );
}
