import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_WEEKLY_BUDGET_CENTS } from '@/lib/expenses/constants';
import { formatBudget, formatCents, remainingCents } from '@/lib/expenses/money';
import { formatMonthLabel, formatWeekLabel } from '@/lib/expenses/format';
import type { ExpenseGrain } from '@/lib/store/expenseStore';
import type { ExpenseSummary } from '@/services/expenseService';

interface ExpenseChartsProps {
  summary: ExpenseSummary | null;
  grain: ExpenseGrain;
  chartMode: 'trend' | 'breakdown';
  selectedKey: string;
}

export function ExpenseCharts({ summary, grain, chartMode, selectedKey }: ExpenseChartsProps) {
  if (!summary) {
    return (
      <div className="flex h-[220px] items-center" role="status" aria-label="Loading chart">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    );
  }

  if (chartMode === 'trend') {
    const weeklyBudgetCents = summary.weeklyBudgetCents ?? DEFAULT_WEEKLY_BUDGET_CENTS;
    const data = summary.periods.map((period) => ({
      key: period.key,
      label: grain === 'week'
        ? formatWeekLabel(period.start, period.end).replace(/ – .*/, '')
        : formatMonthLabel(period.key).slice(0, 3),
      total: period.totalCents / 100,
      totalCents: period.totalCents,
      leftoverCents: remainingCents(weeklyBudgetCents, period.totalCents),
      selected: period.key === selectedKey,
    }));

    const budgetDollars = weeklyBudgetCents / 100;
    const maxSpent = Math.max(0, ...data.map((row) => row.total));
    const yMax = grain === 'week'
      ? Math.max(budgetDollars, maxSpent, 1) * 1.12
      : undefined;

    return (
      <div className="space-y-2">
        {grain === 'week' && (
          <p className="px-1 text-xs text-muted-foreground">
            Bars are spent. The dashed line is the {formatBudget(weeklyBudgetCents)} weekly budget.
          </p>
        )}
        <ChartContainer
          config={{ total: { label: 'Spent', color: 'hsl(var(--primary))' } }}
          className="aspect-auto h-[220px] w-full"
        >
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `$${value}`}
              width={40}
              domain={yMax != null ? [0, Math.ceil(yMax)] : undefined}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                const period = summary.periods.find((item) => item.key === row.key);
                const leftover = row.leftoverCents as number;
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
                    <div className="text-muted-foreground">
                      {grain === 'week'
                        ? formatWeekLabel(period?.start || row.key, period?.end || row.key)
                        : formatMonthLabel(row.key)}
                    </div>
                    <div className="font-medium">{formatCents(row.totalCents)} spent</div>
                    {grain === 'week' && (
                      <div className="text-muted-foreground">
                        {leftover < 0
                          ? `${formatCents(Math.abs(leftover))} over ${formatBudget(weeklyBudgetCents)}`
                          : `${formatCents(leftover)} left of ${formatBudget(weeklyBudgetCents)}`}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {grain === 'week' && (
              <ReferenceLine
                y={budgetDollars}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 4"
                strokeOpacity={0.85}
                ifOverflow="extendDomain"
              />
            )}
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill="hsl(var(--primary))"
                  fillOpacity={entry.selected ? 0.9 : 0.35}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    );
  }

  const slices = summary.categories.map((category) => ({
    key: category.categoryId,
    name: category.name,
    value: category.totalCents / 100,
    color: category.color,
  }));

  if (slices.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
        No spending in this period yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_160px]">
      <ChartContainer config={{}} className="aspect-auto h-[220px] w-full">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={86}
            paddingAngle={2}
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0];
              return (
                <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
                  <div className="text-muted-foreground">{row.name}</div>
                  <div className="font-medium">
                    {formatCents(Math.round(Number(row.value) * 100))}
                  </div>
                </div>
              );
            }}
          />
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col justify-center gap-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate">{slice.name}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatCents(Math.round(slice.value * 100))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
