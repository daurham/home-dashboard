import { describe, expect, it } from 'vitest';
import { parseAmountToCents } from './money';

describe('parseAmountToCents', () => {
  it('parses dollars to integer cents', () => {
    expect(parseAmountToCents('12.50')).toBe(1250);
    expect(parseAmountToCents('$8')).toBe(800);
    expect(parseAmountToCents('0')).toBe(null);
    expect(parseAmountToCents('')).toBe(null);
  });
});
