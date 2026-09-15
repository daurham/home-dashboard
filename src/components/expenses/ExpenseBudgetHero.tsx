import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEFAULT_WEEKLY_BUDGET_CENTS } from '@/lib/expenses/constants';
import { budgetSpentPercent, formatBudget, formatCents, parseAmountToCents } from '@/lib/expenses/money';
import type { ExpenseGrain } from '@/lib/store/expenseStore';
import { cn } from '@/lib/utils';

interface ExpenseBudgetHeroProps {
  grain: ExpenseGrain;
  spentCents: number;
  weeklyBudgetCents?: number;
  vsPriorCents: number | null;
  onSaveBudget: (cents: number) => Promise<void>;
}

export function ExpenseBudgetHero({
  grain,
  spentCents,
  weeklyBudgetCents = DEFAULT_WEEKLY_BUDGET_CENTS,
  vsPriorCents,
  onSaveBudget,
}: ExpenseBudgetHeroProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dollars = weeklyBudgetCents / 100;
    setDraft(Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2));
  }, [weeklyBudgetCents, editing]);

  const save = async () => {
    const cents = parseAmountToCents(draft);
    if (cents == null) {
      setError('Enter a weekly budget greater than 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSaveBudget(cents);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save budget');
    } finally {
      setSaving(false);
    }
  };

  const leftover = grain === 'week' ? weeklyBudgetCents - spentCents : null;
  const overBudget = leftover != null && leftover < 0;
  const spentPct = budgetSpentPercent(weeklyBudgetCents, spentCents);

  const heroCents = leftover == null ? spentCents : Math.abs(leftover);
  const heroLabel = leftover == null
    ? 'spent'
    : overBudget
      ? 'over'
      : leftover === 0
        ? 'on budget'
        : 'left';

  return (
    <div className="min-w-0 space-y-3 px-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-3xl font-semibold tabular-nums tracking-tight">
          {formatCents(heroCents)}
        </p>
        <p className="text-sm text-muted-foreground">{heroLabel}</p>
        {vsPriorCents != null && vsPriorCents !== 0 && (
          <p className="text-sm text-muted-foreground">
            {vsPriorCents > 0 ? '↑' : '↓'} {formatCents(Math.abs(vsPriorCents))} vs prior
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {editing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <span>of</span>
            <Input
              autoFocus
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setEditing(false);
              }}
              aria-label="Weekly budget in dollars"
              className="h-8 w-24"
              disabled={saving}
            />
            <Button type="submit" size="sm" disabled={saving}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <span>
              of {formatBudget(weeklyBudgetCents)} {grain === 'week' ? 'this week' : '/ week'}
            </span>
            {grain === 'week' && (
              <span>· {formatCents(spentCents)} spent</span>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-foreground/80 hover:bg-muted"
              aria-label="Edit weekly budget"
            >
              <Pencil className="h-3.5 w-3.5" />
              Budget
            </button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      {grain === 'week' && (
        <div className="space-y-1.5">
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(spentPct)}
            aria-label="Share of weekly budget spent"
          >
            <div
              className={cn(
                'h-full rounded-full bg-primary transition-[width]',
                overBudget && 'bg-primary/80',
              )}
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {overBudget
              ? `${formatCents(Math.abs(leftover))} past the ${formatBudget(weeklyBudgetCents)} weekly budget`
              : `${Math.round(spentPct)}% of the ${formatBudget(weeklyBudgetCents)} weekly budget`}
          </p>
        </div>
      )}
    </div>
  );
}
