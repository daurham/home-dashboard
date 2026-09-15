import { formatCents } from '@/lib/expenses/money';
import { formatOccurredOn } from '@/lib/expenses/format';
import type { Expense } from '@/services/expenseService';
import { Skeleton } from '@/components/ui/skeleton';

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  onSelect: (expense: Expense) => void;
}

export function ExpenseList({ expenses, loading, onSelect }: ExpenseListProps) {
  if (loading && expenses.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Nothing logged in this period. Add an expense to see it here.
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <button
            type="button"
            onClick={() => onSelect(expense)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className="h-8 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: expense.categoryColor }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate font-medium">{expense.categoryName}</span>
                <span className="shrink-0 tabular-nums font-semibold">
                  {formatCents(expense.amountCents, expense.currency)}
                </span>
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>{formatOccurredOn(expense.occurredOn)}</span>
                {expense.paidBy && <span>· {expense.paidBy}</span>}
                {expense.note && <span className="truncate">· {expense.note}</span>}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
