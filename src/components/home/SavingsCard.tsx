import { HubCard } from '@/components/home/HubCard';
import { SavingsProgressRing } from '@/components/savings/SavingsProgressRing';
import { formatBudget } from '@/lib/expenses/money';
import {
  remainingToGoalCents,
  SAVINGS_KIND_COLORS,
  savingsTotalCents,
} from '@/lib/savings/model';
import { useSavingsStore } from '@/lib/store/savingsStore';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function SavingsCard({ compact = false }: { compact?: boolean }) {
  const accounts = useSavingsStore((s) => s.accounts);
  const goalCents = useSavingsStore((s) => s.goalCents);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const totalCents = savingsTotalCents(accounts);
  const remaining = remainingToGoalCents(totalCents, goalCents);
  const slices = [...accounts]
    .filter((account) => account.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents)
    .map((account) => ({
      id: account.id,
      name: account.name,
      color: SAVINGS_KIND_COLORS[account.kind],
      cents: account.amountCents,
    }));
  const legend = slices.slice(0, compact ? 3 : 5);

  return (
    <HubCard className={compact ? 'p-2' : 'p-3'}>
      <div className={cn('flex items-center justify-between gap-2', compact ? 'mb-1' : 'mb-2')}>
        <h2 className={cn('font-semibold', compact ? 'text-[11px]' : 'text-sm')}>Savings</h2>
        <button
          type="button"
          className={cn('text-muted-foreground hover:text-foreground', compact ? 'text-[10px]' : 'text-xs')}
          onClick={() => setActiveSidebarTab('savings')}
        >
          All
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 text-center">
          <p className={cn('font-medium', compact ? 'text-[11px]' : 'text-sm')}>No savings logged yet</p>
          <p className={cn('mt-1 text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
            Add where money is stored from the Savings tab.
          </p>
        </div>
      ) : (
        <div className={cn(
          'grid min-h-0 flex-1 gap-2',
          compact
            ? 'grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'
            : 'grid-cols-[minmax(5.5rem,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.9fr)]',
        )}>
          <SavingsProgressRing
            slices={slices}
            totalCents={totalCents}
            goalCents={goalCents}
            compact={compact}
          />
          <div className="flex min-h-0 flex-col justify-center gap-1.5 overflow-hidden">
            <div>
              <p className={cn('font-semibold tabular-nums leading-none', compact ? 'text-sm' : 'text-base')}>
                {formatBudget(totalCents)}
              </p>
              <p className={cn('text-muted-foreground', compact ? 'text-[9px]' : 'text-[11px]')}>
                {goalCents > 0 ? `of ${formatBudget(goalCents)} goal` : 'no goal set'}
              </p>
              {goalCents > 0 && (
                <p className={cn(
                  'tabular-nums',
                  remaining < 0 ? 'text-emerald-600' : 'text-muted-foreground',
                  compact ? 'text-[9px]' : 'text-[11px]',
                )}>
                  {remaining < 0
                    ? `${formatBudget(-remaining)} over goal`
                    : `${formatBudget(remaining)} to go`}
                </p>
              )}
            </div>
            <ul className="min-h-0 space-y-1 overflow-hidden">
              {legend.map((slice) => (
                <li key={slice.id} className="flex min-w-0 items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className={cn('min-w-0 flex-1 truncate', compact ? 'text-[10px]' : 'text-xs')}>
                    {slice.name}
                  </span>
                  <span className={cn('shrink-0 tabular-nums text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
                    {formatBudget(slice.cents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </HubCard>
  );
}
