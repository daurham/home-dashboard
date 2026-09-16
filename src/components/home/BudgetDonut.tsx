import { formatBudget } from '@/lib/expenses/money';
import { cn } from '@/lib/utils';

export interface BudgetSlice {
  id: string;
  name: string;
  color: string;
  cents: number;
}

interface BudgetDonutProps {
  slices: BudgetSlice[];
  spentCents: number;
  budgetCents: number;
  compact?: boolean;
  className?: string;
}

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BudgetDonut({
  slices,
  spentCents,
  budgetCents,
  compact = false,
  className,
}: BudgetDonutProps) {
  const leftover = budgetCents - spentCents;
  const over = leftover < 0;
  const pieTotal = over ? Math.max(spentCents, 1) : Math.max(budgetCents, 1);
  const stroke = compact ? 8 : 10;
  let offset = 0;

  return (
    <div className={cn('relative mx-auto aspect-square h-full max-h-full w-auto min-h-0 max-w-full', className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          className="stroke-muted-foreground/25"
          strokeWidth={stroke}
        />
        {slices.filter((slice) => slice.cents > 0).map((slice) => {
          const dash = (slice.cents / pieTotal) * CIRCUMFERENCE;
          const gap = Math.max(0, CIRCUMFERENCE - dash);
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={slice.id}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={slice.color || '#34d399'}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-[18%] flex flex-col items-center justify-center text-center">
        <p className={cn('font-semibold tabular-nums leading-none', compact ? 'text-sm' : 'text-lg')}>
          {formatBudget(Math.abs(leftover))}
        </p>
        <p className={cn('mt-0.5 text-muted-foreground', compact ? 'text-[9px]' : 'text-[11px]')}>
          {budgetCents <= 0 ? 'no budget' : leftover < 0 ? 'over' : 'left'}
        </p>
      </div>
    </div>
  );
}
