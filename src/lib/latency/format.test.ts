import { describe, expect, it } from 'vitest';
import {
  buildSparklinePolylines,
  describeEndpoint,
  formatCheckedAgo,
  formatDuration,
  formatLatency,
  formatSampleWindow,
  summarizeSamples,
} from './format';

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

describe('summarizeSamples', () => {
  it('ignores failed checks in the statistics but counts them', () => {
    const stats = summarizeSamples([20, null, 40, 30]);
    expect(stats).toMatchObject({ total: 4, measured: 3, failures: 1, latest: 30, min: 20, max: 40, avg: 30 });
  });

  it('reports nothing measurable when every check failed', () => {
    expect(summarizeSamples([null, null])).toMatchObject({ measured: 0, failures: 2, latest: null, avg: null });
  });
});

describe('formatDuration', () => {
  it('scales from seconds to hours', () => {
    expect(formatDuration(30_000)).toBe('30s');
    expect(formatDuration(45 * 60_000)).toBe('45 min');
    expect(formatDuration(150 * 60_000)).toBe('2.5h');
  });
});

describe('formatSampleWindow', () => {
  it('describes how much history the sparkline covers', () => {
    expect(formatSampleWindow(90, 30_000)).toBe('90 checks · about 45 min');
    expect(formatSampleWindow(1, 30_000)).toBe('1 check · about 30s');
    expect(formatSampleWindow(0, 30_000)).toBe('no checks yet');
  });
});

describe('describeEndpoint', () => {
  it('prefers the endpoint reported by the server', () => {
    expect(describeEndpoint({ type: 'http', endpoint: 'http://127.0.0.1:3000/api/health' })).toBe(
      'http://127.0.0.1:3000/api/health',
    );
  });

  it('falls back when an older backend omits it', () => {
    expect(describeEndpoint({ type: 'postgres' })).toContain('server');
    expect(describeEndpoint({ type: 'tcp' })).toContain('server');
  });
});
