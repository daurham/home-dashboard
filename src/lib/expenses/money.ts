export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

/** Parse a typed amount like "12.5" or "$12.50" into cents. */
export function parseAmountToCents(raw: string, options?: { allowZero?: boolean }): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n === 0) return options?.allowZero ? 0 : null;
  return dollarsToCents(n);
}

export function centsToInput(cents: number | null): string {
  if (!cents) return '';
  return (cents / 100).toFixed(2);
}

export function remainingCents(budgetCents: number, spentCents: number): number {
  return budgetCents - spentCents;
}

export function budgetSpentPercent(budgetCents: number, spentCents: number): number {
  if (budgetCents <= 0) return 0;
  return Math.min(100, (spentCents / budgetCents) * 100);
}

/** $150 when the amount is whole dollars; otherwise $150.50. */
export function formatBudget(cents: number, currency = 'USD'): string {
  const dollars = (cents || 0) / 100;
  const whole = Number.isInteger(dollars);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(dollars);
}
