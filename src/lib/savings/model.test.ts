import { describe, expect, it } from 'vitest';
import {
  remainingToGoalCents,
  savingsProgressPercent,
  savingsTotalCents,
  type SavingsAccount,
} from './model';

const account = (amountCents: number, id = 'a'): SavingsAccount => ({
  id,
  name: 'Test',
  location: 'Bank',
  kind: 'savings',
  amountCents,
  notes: '',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('savings totals', () => {
  it('sums accounts toward the goal', () => {
    expect(savingsTotalCents([account(25000), account(75000, 'b')])).toBe(100000);
    expect(savingsProgressPercent(40000, 100000)).toBe(40);
    expect(savingsProgressPercent(150000, 100000)).toBe(100);
    expect(savingsProgressPercent(5000, 0)).toBe(0);
    expect(remainingToGoalCents(40000, 100000)).toBe(60000);
    expect(remainingToGoalCents(120000, 100000)).toBe(-20000);
  });
});
