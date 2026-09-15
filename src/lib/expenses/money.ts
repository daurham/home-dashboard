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
export function parseAmountToCents(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return dollarsToCents(n);
}

export function centsToInput(cents: number | null): string {
  if (!cents) return '';
  return (cents / 100).toFixed(2);
}
