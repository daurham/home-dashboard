import { describe, expect, it } from 'vitest';
import { budgetSpentPercent, formatBudget, parseAmountToCents, remainingCents } from './money';

describe('parseAmountToCents', () => {
  it('parses dollars to integer cents', () => {
    expect(parseAmountToCents('12.50')).toBe(1250);
    expect(parseAmountToCents('$8')).toBe(800);
    expect(parseAmountToCents('0')).toBe(null);
    expect(parseAmountToCents('')).toBe(null);
  });
});

describe('weekly budget remaining', () => {
  it('computes leftover against the $150 default', () => {
    expect(remainingCents(15000, 6300)).toBe(8700);
    expect(remainingCents(15000, 16200)).toBe(-1200);
    expect(budgetSpentPercent(15000, 7500)).toBe(50);
    expect(budgetSpentPercent(15000, 20000)).toBe(100);
    expect(formatBudget(15000)).toMatch(/\$150/);
    expect(formatBudget(15050)).toMatch(/\$150\.50/);
  });
});
