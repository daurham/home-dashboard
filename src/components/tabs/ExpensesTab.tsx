import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useExpenseStore } from '@/lib/store/expenseStore';
import { usePreferencesStore } from '@/lib/store/preferencesStore';
import { formatCents } from '@/lib/expenses/money';
import { formatMonthLabel, formatWeekLabel } from '@/lib/expenses/format';
import { getExpenseWeekRange } from '@/lib/expenses/weekRange';
import { ExpenseFormSheet } from '@/components/expenses/ExpenseFormSheet';
import { ExpenseCharts } from '@/components/expenses/ExpenseCharts';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseBudgetHero } from '@/components/expenses/ExpenseBudgetHero';
import { CategoryManagerSheet } from '@/components/expenses/CategoryManagerSheet';
import type { Expense } from '@/services/expenseService';
import { cn } from '@/lib/utils';
import { FetchSkeleton } from '@/components/ui/fetch-skeleton';

export function ExpensesTab() {
  const expenseTimeZone = usePreferencesStore((state) => state.expenseTimeZone);
  const {
    grain,
    chartMode,
    selectedWeekKey,
    selectedMonthKey,
    expenses,
    categories,
    summary,
    isLoading,
    hasLoaded,
    loadError,
    load,
    setGrain,
    setChartMode,
    shiftPeriod,
    goToCurrentPeriod,
    addExpense,
    editExpense,
    removeExpense,
    restoreExpense,
    addCategory,
    editCategory,
    setWeeklyBudget,
  } = useExpenseStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    void load(expenseTimeZone).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not load expenses');
    });
  }, [expenseTimeZone, load]);

  const weekRange = useMemo(
    () => getExpenseWeekRange(selectedWeekKey, expenseTimeZone),
    [selectedWeekKey, expenseTimeZone],
  );

  const periodLabel = grain === 'week'
    ? formatWeekLabel(weekRange.weekStartDate, weekRange.weekEndDate)
    : formatMonthLabel(selectedMonthKey);

  const totalCents = summary?.selectedPeriodTotalCents ?? 0;
  const previousTotal = useMemo(() => {
    if (!summary) return null;
    const selectedKey = grain === 'week' ? selectedWeekKey : selectedMonthKey;
    const index = summary.periods.findIndex((period) => period.key === selectedKey);
    if (index <= 0) return null;
    return summary.periods[index - 1].totalCents;
  }, [summary, grain, selectedWeekKey, selectedMonthKey]);

  const delta = previousTotal == null ? null : totalCents - previousTotal;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="relative space-y-5 pb-20 md:pb-4">
      {loadError && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
          Couldn’t reach the expenses API ({loadError}). Check that home-ai is up and the dashboard is proxying <code className="text-xs">/api</code> to it.
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftPeriod(-1)} aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={goToCurrentPeriod}
              className="truncate text-left text-lg font-semibold text-foreground hover:underline"
            >
              {periodLabel}
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftPeriod(1)} aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <ExpenseBudgetHero
            grain={grain}
            spentCents={totalCents}
            weeklyBudgetCents={summary?.weeklyBudgetCents}
            vsPriorCents={delta}
            onSaveBudget={setWeeklyBudget}
            loading={!hasLoaded}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoriesOpen(true)}>
            <Settings2 className="h-4 w-4" />
            Categories
          </Button>
          <Button onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={chartMode}
          onValueChange={(value) => value && setChartMode(value as 'trend' | 'breakdown')}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="trend" className="px-3">Trend</ToggleGroupItem>
          <ToggleGroupItem value="breakdown" className="px-3">Breakdown</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="single"
          value={grain}
          onValueChange={(value) => value && setGrain(value as 'week' | 'month')}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="week" className="px-3">Week</ToggleGroupItem>
          <ToggleGroupItem value="month" className="px-3">Month</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="rounded-xl border bg-card p-3 md:p-4">
        {!hasLoaded ? (
          <FetchSkeleton lines={1} lineClassName="h-[220px] rounded-xl" />
        ) : (
          <ExpenseCharts
            summary={summary}
            grain={grain}
            chartMode={chartMode}
            selectedKey={grain === 'week' ? selectedWeekKey : selectedMonthKey}
          />
        )}
      </div>

      <div className="space-y-2">
        <h3 className="px-1 text-sm font-semibold text-foreground">
          {grain === 'week' ? 'This week' : 'This month'}
        </h3>
        <ExpenseList
          expenses={expenses}
          loading={isLoading || !hasLoaded}
          onSelect={(expense) => {
            setEditing(expense);
            setFormOpen(true);
          }}
        />
      </div>

      <Button
        onClick={openCreate}
        className={cn(
          'fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full shadow-lg sm:hidden',
        )}
        size="icon"
        aria-label="Add expense"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <ExpenseFormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        expense={editing}
        categories={categories}
        timeZone={expenseTimeZone}
        onSubmit={async (values) => {
          if (editing) {
            const previous = { ...editing };
            await editExpense(editing.id, {
              amountCents: values.amountCents,
              categoryId: values.categoryId,
              note: values.note || null,
              paidBy: values.paidBy ?? null,
              occurredOn: values.occurredOn,
            });
            toast.success('Updated', {
              action: {
                label: 'Undo',
                onClick: () => {
                  void editExpense(previous.id, {
                    amountCents: previous.amountCents,
                    categoryId: previous.categoryId,
                    note: previous.note || null,
                    paidBy: previous.paidBy || null,
                    occurredOn: previous.occurredOn,
                  });
                },
              },
            });
          } else {
            const created = await addExpense(values);
            const leftover = useExpenseStore.getState().summary?.remainingCents;
            const leftoverLabel = leftover == null
              ? `Saved ${formatCents(created.amountCents)}`
              : leftover < 0
                ? `Saved ${formatCents(created.amountCents)} · ${formatCents(Math.abs(leftover))} over`
                : `Saved ${formatCents(created.amountCents)} · ${formatCents(leftover)} left`;
            toast.success(leftoverLabel, {
              action: {
                label: 'Undo',
                onClick: () => {
                  void removeExpense(created.id);
                },
              },
            });
          }
        }}
        onDelete={editing ? async () => {
          const removed = editing;
          await removeExpense(removed.id);
          toast.success('Removed', {
            action: {
              label: 'Undo',
              onClick: () => {
                void restoreExpense(removed.id);
              },
            },
          });
        } : undefined}
      />

      <CategoryManagerSheet
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        categories={categories}
        onCreate={async (name, color) => {
          await addCategory(name, color);
        }}
        onUpdate={async (id, updates) => {
          await editCategory(id, updates);
        }}
      />
    </div>
  );
}
