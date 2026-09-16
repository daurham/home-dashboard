import { CalendarDays, Camera, DollarSign, Users } from 'lucide-react';
import { HubCard } from '@/components/home/HubCard';
import { formatCents, budgetSpentPercent, formatBudget } from '@/lib/expenses/money';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardsProps {
  monthSpendCents: number;
  vsPriorPercent: number | null;
  weeklySpentCents: number;
  weeklyBudgetCents: number;
  choresDueToday: number;
  choresCompletedToday: number;
  eventsToday: number;
  nextEventLabel: string | null;
  camerasOnline: number;
  camerasTotal: number;
  compact?: boolean;
  loading?: boolean;
}

export function StatCards({
  monthSpendCents,
  vsPriorPercent,
  weeklySpentCents,
  weeklyBudgetCents,
  choresDueToday,
  choresCompletedToday,
  eventsToday,
  nextEventLabel,
  camerasOnline,
  camerasTotal,
  compact = false,
  loading = false,
}: StatCardsProps) {
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const spentPct = budgetSpentPercent(weeklyBudgetCents, weeklySpentCents);

  if (loading) {
    return (
      <HubCard className={compact ? 'p-1.5' : 'p-3'}>
        <div
          className={cn('grid h-full gap-1', compact ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-2 xl:grid-cols-4 gap-2')}
          role="status"
          aria-label="Loading overview"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className={cn('h-full min-h-[3.25rem] rounded-lg', !compact && 'min-h-[5.5rem]')} />
          ))}
        </div>
      </HubCard>
    );
  }

  if (compact) {
    const cameraNote = camerasTotal === 0
      ? 'None set up'
      : camerasOnline === camerasTotal
        ? 'All online'
        : `${camerasTotal - camerasOnline} offline`;

    return (
      <HubCard className="p-1.5">
        <div className="grid h-full grid-cols-2 gap-1 xl:grid-cols-4">
          <button
            type="button"
            className="min-w-0 rounded-lg border-l-[3px] border-emerald-500 bg-emerald-500/5 px-2 py-1 text-left hover:bg-emerald-500/10"
            onClick={() => setActiveSidebarTab('expenses')}
          >
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Expenses</p>
            <p className="truncate text-sm font-semibold tabular-nums leading-tight">{formatBudget(monthSpendCents)}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${spentPct}%` }} />
              </div>
              <p className="shrink-0 text-[9px] tabular-nums text-muted-foreground">
                {Math.round(spentPct)}%
                {vsPriorPercent != null && (
                  <span className={cn('ml-0.5', vsPriorPercent <= 0 ? 'text-emerald-600' : 'text-amber-600')}>
                    {vsPriorPercent <= 0 ? '↓' : '↑'}{Math.abs(Math.round(vsPriorPercent))}
                  </span>
                )}
              </p>
            </div>
          </button>

          <button
            type="button"
            className="min-w-0 rounded-lg border-l-[3px] border-amber-500 bg-amber-500/5 px-2 py-1 text-left hover:bg-amber-500/10"
            onClick={() => setActiveSidebarTab('chores')}
          >
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Chores</p>
            <p className="truncate text-sm font-semibold leading-tight">
              {choresDueToday}
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">due</span>
            </p>
            <p className="truncate text-[9px] text-muted-foreground">{choresCompletedToday} done today</p>
          </button>

          <button
            type="button"
            className="min-w-0 rounded-lg border-l-[3px] border-violet-500 bg-violet-500/5 px-2 py-1 text-left hover:bg-violet-500/10"
            onClick={() => setActiveSidebarTab('calendar')}
          >
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Calendar</p>
            <p className="truncate text-sm font-semibold leading-tight">
              {eventsToday}
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">today</span>
            </p>
            <p className="truncate text-[9px] text-muted-foreground">
              {nextEventLabel ? nextEventLabel : 'Nothing else'}
            </p>
          </button>

          <button
            type="button"
            className="min-w-0 rounded-lg border-l-[3px] border-sky-500 bg-sky-500/5 px-2 py-1 text-left hover:bg-sky-500/10"
            onClick={() => setActiveSidebarTab('cameras')}
          >
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Cameras</p>
            <p className="truncate text-sm font-semibold leading-tight">
              {camerasOnline}
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">online</span>
            </p>
            <p className="truncate text-[9px] text-muted-foreground">{cameraNote}</p>
          </button>
        </div>
      </HubCard>
    );
  }

  return (
    <HubCard className="p-2">
      <div className="grid h-full grid-cols-2 gap-2 xl:grid-cols-4">
        <button type="button" className="min-w-0 rounded-xl px-2 py-1.5 text-left hover:bg-muted/50" onClick={() => setActiveSidebarTab('expenses')}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <DollarSign className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Expenses</p>
              <p className="truncate text-base font-semibold tabular-nums leading-tight">{formatCents(monthSpendCents)}</p>
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${spentPct}%` }} />
            </div>
            <p className="shrink-0 text-[10px] text-muted-foreground">
              {formatBudget(weeklySpentCents)}/{formatBudget(weeklyBudgetCents)}
              {vsPriorPercent != null && (
                <span className={cn('ml-1', vsPriorPercent <= 0 ? 'text-emerald-600' : 'text-amber-600')}>
                  {vsPriorPercent <= 0 ? '↓' : '↑'}{Math.abs(Math.round(vsPriorPercent))}%
                </span>
              )}
            </p>
          </div>
        </button>

        <button type="button" className="min-w-0 rounded-xl px-2 py-1.5 text-left hover:bg-muted/50" onClick={() => setActiveSidebarTab('chores')}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <Users className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Chores</p>
              <p className="truncate text-base font-semibold leading-tight">{choresDueToday} due today</p>
              <p className="text-[10px] text-muted-foreground">{choresCompletedToday} completed</p>
            </div>
          </div>
        </button>

        <button type="button" className="min-w-0 rounded-xl px-2 py-1.5 text-left hover:bg-muted/50" onClick={() => setActiveSidebarTab('calendar')}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300">
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Calendar</p>
              <p className="truncate text-base font-semibold leading-tight">{eventsToday} events today</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {nextEventLabel ? `Next: ${nextEventLabel}` : 'Nothing else today'}
              </p>
            </div>
          </div>
        </button>

        <button type="button" className="min-w-0 rounded-xl px-2 py-1.5 text-left hover:bg-muted/50" onClick={() => setActiveSidebarTab('cameras')}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
              <Camera className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Cameras</p>
              <p className="truncate text-base font-semibold leading-tight">{camerasOnline} online</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {camerasTotal === 0 ? 'No cameras configured' : camerasOnline === camerasTotal ? 'All systems normal' : 'Check camera status'}
              </p>
            </div>
          </div>
        </button>
      </div>
    </HubCard>
  );
}
