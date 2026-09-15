import { describe, expect, it } from 'vitest';
import { buildSparklinePolylines, formatCheckedAgo, formatLatency } from './format';

describe('buildSparklinePolylines', () => {
  it('breaks the line across failed samples', () => {
    const lines = buildSparklinePolylines([10, 20, null, 30], 90, 32);
    expect(lines).toHaveLength(2);
    expect(lines[0].split(' ')).toHaveLength(2);
    expect(lines[1].split(' ')).toHaveLength(1);
  });

  it('returns no segments when every sample failed', () => {
    expect(buildSparklinePolylines([null, null], 90, 32)).toEqual([]);
  });
});

describe('formatCheckedAgo', () => {
  it('uses coarse relative buckets', () => {
    const now = Date.parse('2026-09-15T00:00:00.000Z');
    expect(formatCheckedAgo('2026-09-14T23:59:58.000Z', now)).toBe('just now');
    expect(formatCheckedAgo('2026-09-14T23:59:20.000Z', now)).toBe('40s ago');
    expect(formatCheckedAgo(null, now)).toBe('not yet checked');
  });
});

describe('formatLatency', () => {
  it('shows down instead of a fake millisecond value', () => {
    expect(formatLatency(null, 'down')).toBe('down');
    expect(formatLatency(45, 'up')).toBe('45ms');
  });
});
