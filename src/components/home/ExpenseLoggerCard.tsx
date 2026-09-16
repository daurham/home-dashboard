import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { HubCard } from '@/components/home/HubCard';
import { BudgetDonut } from '@/components/home/BudgetDonut';
import { ExpenseFormSheet } from '@/components/expenses/ExpenseFormSheet';
import { useExpenseStore } from '@/lib/store/expenseStore';
import { usePreferencesStore, useUIStore } from '@/lib/store';
import { formatBudget, formatCents, remainingCents } from '@/lib/expenses/money';
import { DEFAULT_WEEKLY_BUDGET_CENTS } from '@/lib/expenses/constants';
import { getExpenseWeekRange, todayYmd } from '@/lib/expenses/weekRange';
import { formatDate } from '@/lib/calendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FetchSkeleton } from '@/components/ui/fetch-skeleton';

export function ExpenseLoggerCard({ compact = false }: { compact?: boolean }) {
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const expenseTimeZone = usePreferencesStore((s) => s.expenseTimeZone);
  const { expenses, categories, addExpense, load, summary, hasLoaded } = useExpenseStore();
  const [formOpen, setFormOpen] = useState(false);

  const weekRange = useMemo(
    () => getExpenseWeekRange(todayYmd(expenseTimeZone), expenseTimeZone),
    [expenseTimeZone],
  );

  const weekKeys = useMemo(() => {
    const keys = new Set<string>();
    const start = new Date(`${weekRange.weekStartDate}T12:00:00`);
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      keys.add(formatDate(date));
    }
    return keys;
  }, [weekRange.weekStartDate]);

  const weekExpenses = useMemo(
    () => expenses.filter((expense) => weekKeys.has(expense.occurredOn)),
    [expenses, weekKeys],
  );

  const weekTotal = weekExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const weeklyBudgetCents = summary?.weeklyBudgetCents ?? DEFAULT_WEEKLY_BUDGET_CENTS;
  const leftover = remainingCents(weeklyBudgetCents, weekTotal);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; cents: number }>();
    for (const expense of weekExpenses) {
      const current = map.get(expense.categoryId) ?? {
        id: expense.categoryId,
        name: expense.categoryName,
        color: expense.categoryColor,
        cents: 0,
      };
      current.cents += expense.amountCents;
      map.set(expense.categoryId, current);
    }
    return [...map.values()].sort((a, b) => b.cents - a.cents);
  }, [weekExpenses]);

  const form = (
    <ExpenseFormSheet
      open={formOpen}
      onOpenChange={setFormOpen}
      categories={categories}
      timeZone={expenseTimeZone}
      onSubmit={async (values) => {
        await addExpense(values);
        toast.success('Expense added');
        await load(expenseTimeZone).catch(() => undefined);
      }}
    />
  );

  return (
    <HubCard className={compact ? 'p-2' : 'p-3'}>
      <div className={cn('flex items-center justify-between gap-2', compact ? 'mb-1' : 'mb-2')}>
        <h2 className={cn('font-semibold', compact ? 'text-[11px]' : 'text-sm')}>
          {compact ? 'Expenses' : 'Expense Logger'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className={cn(
              'inline-flex items-center gap-0.5 font-medium text-emerald-600 hover:text-emerald-700',
              compact ? 'text-[10px]' : 'text-xs',
            )}
          >
            <Plus className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            Add
          </button>
          <button
            type="button"
            className={cn('text-muted-foreground hover:text-foreground', compact ? 'text-[10px]' : 'text-xs')}
            onClick={() => setActiveSidebarTab('expenses')}
          >
            All
          </button>
        </div>
      </div>

      {!hasLoaded ? (
        <FetchSkeleton lines={compact ? 3 : 4} lineClassName={compact ? 'h-10 rounded-lg' : 'h-14 rounded-xl'} />
      ) : (
      <div className={cn('grid min-h-0 flex-1 gap-2', compact ? 'grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]' : 'grid-cols-[minmax(5.5rem,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(7.5rem,0.9fr)]')}>
        <BudgetDonut
          slices={categoryTotals}
          spentCents={weekTotal}
          budgetCents={weeklyBudgetCents}
          compact={compact}
        />

        <div className="flex min-h-0 flex-col justify-center gap-1.5 overflow-hidden">
          <div>
            <p className={cn('font-semibold tabular-nums leading-none', compact ? 'text-sm' : 'text-base')}>
              {formatCents(weekTotal)}
            </p>
            <p className={cn('text-muted-foreground', compact ? 'text-[9px]' : 'text-[11px]')}>
              of {formatBudget(weeklyBudgetCents)} this week
            </p>
            <p className={cn('tabular-nums', leftover < 0 ? 'text-amber-600' : 'text-muted-foreground', compact ? 'text-[9px]' : 'text-[11px]')}>
              {leftover < 0 ? `${formatBudget(-leftover)} over` : `${formatBudget(leftover)} remaining`}
            </p>
          </div>
          <ul className="min-h-0 space-y-1 overflow-hidden">
            {categoryTotals.length === 0 && (
              <li className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>No spend this week.</li>
            )}
            {categoryTotals.slice(0, compact ? 3 : 5).map((category) => (
              <li key={category.id} className="flex min-w-0 items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                <span className={cn('min-w-0 flex-1 truncate', compact ? 'text-[10px]' : 'text-xs')}>{category.name}</span>
                <span className={cn('shrink-0 tabular-nums text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
                  {formatBudget(category.cents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      )}
      {form}
    </HubCard>
  );
}
