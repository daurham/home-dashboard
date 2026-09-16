import { describe, expect, it } from 'vitest';
import { looksLikeSeedChores, looksLikeSeedHabits } from '@/lib/store/browserBackup';

function chore(overrides: {
  id?: string;
  title?: string;
  lastCompletedOn?: string | null;
  completedOccurrences?: Record<string, string>;
}) {
  return {
    title: 'Take bins out',
    lastCompletedOn: null as string | null,
    completedOccurrences: {} as Record<string, string>,
    createdAt: '2026-09-15T12:00:00.000Z',
    ...overrides,
  };
}

const seedChores = () => [
  chore({ title: 'Take bins out' }),
  chore({ title: 'Vacuum upstairs', lastCompletedOn: '2026-09-15' }),
  chore({ title: 'Clean bathrooms', lastCompletedOn: '2026-09-14', completedOccurrences: { '2026-09-15': '2026-09-15' } }),
  chore({ title: 'Water plants' }),
];

describe('looksLikeSeedChores', () => {
  it('recognizes the untouched demo list', () => {
    expect(looksLikeSeedChores(seedChores())).toBe(true);
  });

  it('treats a used list as real household data', () => {
    const used = seedChores();
    used[0] = { ...used[0], lastCompletedOn: '2026-08-01' };
    expect(looksLikeSeedChores(used)).toBe(false);
    expect(looksLikeSeedChores([...seedChores(), chore({ title: 'Wipe counters' })])).toBe(false);
  });
});

describe('looksLikeSeedHabits', () => {
  const seed = () => [
    { name: 'Drink 2L water', completions: { '2026-09-15': true }, createdAt: '2026-09-15T12:00:00.000Z' },
    { name: 'Workout', completions: {}, createdAt: '2026-09-15T12:00:00.000Z' },
    { name: 'No screens after 9pm', completions: {}, createdAt: '2026-09-15T12:00:00.000Z' },
    { name: 'Meditate', completions: {}, createdAt: '2026-09-15T12:00:00.000Z' },
  ];

  it('recognizes the untouched demo list', () => {
    expect(looksLikeSeedHabits(seed())).toBe(true);
  });

  it('treats older checkmarks as real history', () => {
    const used = seed();
    used[0] = { ...used[0], completions: { '2026-08-01': true } };
    expect(looksLikeSeedHabits(used)).toBe(false);
  });
});
