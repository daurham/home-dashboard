import { describe, expect, it } from 'vitest';
import { isAutoDark } from './schedule';

function at(isoLocal: string): Date {
  return new Date(isoLocal);
}

describe('isAutoDark', () => {
  it('is dark after the evening start in an overnight window', () => {
    expect(isAutoDark(at('2026-09-16T20:00:00'), '20:00', '07:00')).toBe(true);
    expect(isAutoDark(at('2026-09-16T23:30:00'), '20:00', '07:00')).toBe(true);
  });

  it('stays dark until the morning end', () => {
    expect(isAutoDark(at('2026-09-16T06:59:00'), '20:00', '07:00')).toBe(true);
    expect(isAutoDark(at('2026-09-16T07:00:00'), '20:00', '07:00')).toBe(false);
  });

  it('stays light during the day unless forecast night says otherwise', () => {
    expect(isAutoDark(at('2026-09-16T15:00:00'), '20:00', '07:00')).toBe(false);
    expect(isAutoDark(at('2026-09-16T15:00:00'), '20:00', '07:00', undefined, false)).toBe(true);
    expect(isAutoDark(at('2026-09-16T15:00:00'), '20:00', '07:00', undefined, true)).toBe(false);
  });
});
