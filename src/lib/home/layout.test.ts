import {
  DEFAULT_HIDDEN_HOME_MODULES,
  DEFAULT_HOME_ORDER,
  DEFAULT_HOME_SCALES,
  HOME_MODULES,
  homeGridTemplateRows,
  moveItem,
  normalizeHomeOrder,
  packHomeLayout,
  visibleHomeOrder,
  withDefaultHiddenModules,
} from './layout';
import type { HomeModuleId } from './layout';
import { describe, expect, it } from 'vitest';

describe('normalizeHomeOrder', () => {
  it('fills in missing modules and drops unknowns', () => {
    expect(normalizeHomeOrder(['chores', 'stats'] as HomeModuleId[])).toEqual([
      'chores',
      'stats',
      'expenses',
      'savings',
      'habits',
      'calendar',
      'latency',
      'cameras',
    ]);
  });
});

describe('visibleHomeOrder', () => {
  it('keeps layout order while omitting hidden modules', () => {
    expect(visibleHomeOrder(['chores', 'stats'] as HomeModuleId[], ['stats', 'cameras'])).toEqual([
      'chores',
      'expenses',
      'savings',
      'habits',
      'calendar',
      'latency',
    ]);
  });

  it('keeps savings off the home grid until it is added back', () => {
    expect(DEFAULT_HIDDEN_HOME_MODULES).toEqual(['savings']);
    expect(visibleHomeOrder(DEFAULT_HOME_ORDER, DEFAULT_HIDDEN_HOME_MODULES)).not.toContain('savings');
  });
});

describe('withDefaultHiddenModules', () => {
  it('hides savings for layouts that never had the module', () => {
    expect(withDefaultHiddenModules(['stats', 'expenses'], [])).toEqual(['savings']);
  });

  it('does not re-hide savings once the saved layout already knows it', () => {
    expect(withDefaultHiddenModules(['stats', 'savings'], [])).toEqual([]);
  });
});

describe('moveItem', () => {
  it('moves an item forward past the target', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward before the target', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual(['a', 'd', 'b', 'c']);
  });
});

describe('packHomeLayout', () => {
  it('places a full-width overview then two rows of full tiles', () => {
    const packed = packHomeLayout(
      visibleHomeOrder(DEFAULT_HOME_ORDER, DEFAULT_HIDDEN_HOME_MODULES),
      DEFAULT_HOME_SCALES,
      3,
    );
    expect(packed.rowCount).toBe(5);
    expect(homeGridTemplateRows(packed.placements, packed.rowCount)).toBe(
      'auto minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)',
    );
    expect(packed.placements[0]).toMatchObject({ id: 'stats', columnSpan: 3, rowSpan: 1 });
    expect(packed.placements.find((item) => item.id === 'cameras')).toMatchObject({ rowSpan: 2 });
  });

  it('lets two compact tiles share the height of one full tile', () => {
    const packed = packHomeLayout(
      ['expenses', 'chores'],
      { ...DEFAULT_HOME_SCALES, expenses: 'compact', chores: 'compact' },
      1,
    );
    expect(packed.placements.find((item) => item.id === 'expenses')?.rowSpan).toBe(1);
    expect(packed.placements.find((item) => item.id === 'chores')?.rowSpan).toBe(1);
    expect(packed.rowCount).toBe(2);
  });

  it('keeps cameras full height', () => {
    expect(HOME_MODULES.cameras.canResize).toBe(false);
    const packed = packHomeLayout(
      ['cameras'],
      { ...DEFAULT_HOME_SCALES, cameras: 'compact' },
      1,
    );
    expect(packed.placements[0].rowSpan).toBe(2);
  });

  it('lets a wide calendar occupy two mid-size tiles', () => {
    const packed = packHomeLayout(
      ['calendar', 'latency'],
      { ...DEFAULT_HOME_SCALES, calendar: 'wide' },
      3,
    );
    expect(packed.placements.find((item) => item.id === 'calendar')).toMatchObject({
      columnSpan: 2,
      rowSpan: 3,
    });
    expect(packed.placements.find((item) => item.id === 'latency')).toMatchObject({
      column: 3,
      columnSpan: 1,
      rowSpan: 2,
    });
  });

  it('falls back to one column when the grid is only one wide', () => {
    const packed = packHomeLayout(
      ['calendar'],
      { ...DEFAULT_HOME_SCALES, calendar: 'wide' },
      1,
    );
    expect(packed.placements[0]).toMatchObject({ columnSpan: 1, rowSpan: 3 });
  });
});
