import { HubCard } from '@/components/home/HubCard';
import { CHORE_ICON_COLORS, CHORE_ICONS } from '@/components/home/choreIcons';
import {
  choreQueue,
  formatChoreInterval,
  useChoreStore,
  type ChoreStatus,
  type ChoreStatusTone,
} from '@/lib/store/choreStore';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FetchSkeleton } from '@/components/ui/fetch-skeleton';

const STATUS_STYLES: Record<ChoreStatusTone, string> = {
  overdue: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  today: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  tomorrow: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  yesterday: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  muted: 'bg-muted text-muted-foreground',
};

const TONE_TEXT: Record<ChoreStatusTone, string> = {
  overdue: 'text-rose-600 dark:text-rose-400',
  today: 'text-emerald-600 dark:text-emerald-400',
  tomorrow: 'text-amber-600 dark:text-amber-400',
  done: 'text-emerald-600 dark:text-emerald-400',
  yesterday: 'text-muted-foreground',
  muted: 'text-muted-foreground',
};

/** Short labels for the compact tile, where "Overdue · Sep 16" will not fit. */
function compactLabel(status: ChoreStatus): string {
  switch (status.tone) {
    case 'overdue':
      return 'Late';
    case 'today':
      return 'Today';
    case 'tomorrow':
      return 'Tomorrow';
    default:
      return status.label;
  }
}

export function RecurringChoresCard({ compact = false }: { compact?: boolean }) {
  const chores = useChoreStore((s) => s.chores);
  const hasLoaded = useChoreStore((s) => s.hasLoaded);
  const toggleComplete = useChoreStore((s) => s.toggleComplete);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);

  const queue = choreQueue(chores);
  const visible = queue.slice(0, compact ? 4 : 6);

  if (compact) {
    return (
      <HubCard className="p-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold">
            Chores
            {queue.length > 0 && (
              <span className="ml-1 font-normal text-muted-foreground">{queue.length} due</span>
            )}
          </h2>
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => setActiveSidebarTab('chores')}
          >
            All
          </button>
        </div>

        { !hasLoaded ? (
          <FetchSkeleton lines={compact ? 3 : 4} lineClassName={compact ? 'h-8 rounded-lg' : 'h-12 rounded-xl'} />
        ) : visible.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-[11px] text-muted-foreground">All caught up this week.</p>
          </div>
        ) : (
          <ul className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 content-start gap-1">
            {visible.map(({ chore, status }, index) => {
              const Icon = CHORE_ICONS[chore.icon];
              const wideCell = visible.length === 1 || (visible.length === 3 && index === 2);
              return (
                // Capped so a short queue keeps chip proportions instead of stretching.
                <li key={chore.id} className={cn('min-w-0 max-h-12', wideCell && 'col-span-2')}>
                  <button
                    type="button"
                    onClick={() => toggleComplete(chore.id)}
                    className="flex h-full w-full items-center gap-2 rounded-lg bg-muted/40 px-2 py-1 text-left hover:bg-muted"
                  >
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', CHORE_ICON_COLORS[chore.icon])}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium leading-tight">{chore.title}</span>
                      <span className={cn('block truncate text-[9px] font-medium leading-tight', TONE_TEXT[status.tone])}>
                        {compactLabel(status)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </HubCard>
    );
  }

  return (
    <HubCard className="p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Recurring Chores
          {queue.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{queue.length} due</span>
          )}
        </h2>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setActiveSidebarTab('chores')}>
          All
        </button>
      </div>

      {!hasLoaded ? (
        <FetchSkeleton lines={4} lineClassName="h-12 rounded-xl" />
      ) : visible.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground">All caught up — nothing due this week.</p>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-start gap-1 overflow-y-auto">
          {visible.map(({ chore, status }) => {
            const Icon = CHORE_ICONS[chore.icon];
            return (
              <li key={chore.id} className="min-h-0 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleComplete(chore.id)}
                  className="flex h-11 w-full items-center gap-2 rounded-lg px-0.5 py-1 text-left hover:bg-muted/50"
                >
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', CHORE_ICON_COLORS[chore.icon])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium leading-tight">{chore.title}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {chore.assignee} · {formatChoreInterval(chore)}
                    </span>
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_STYLES[status.tone])}>
                    {status.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </HubCard>
  );
}
