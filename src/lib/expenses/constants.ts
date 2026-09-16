import { DEFAULT_EXPENSE_TIMEZONE } from './weekRange';

export { DEFAULT_EXPENSE_TIMEZONE };

export const DEFAULT_WEEKLY_BUDGET_CENTS = 15000;

export const PAID_BY_OPTIONS = [
  { value: 'Jake', label: 'Jake' },
  { value: 'Wife', label: 'Wife' },
  { value: 'Both', label: 'Both' },
] as const;

export const QUICK_AMOUNTS_CENTS = [800, 1200, 2000, 5000];

export const CATEGORY_COLOR_PRESETS = [
  '#8A9A7B',
  '#C4A484',
  '#7A92A8',
  '#B5A394',
  '#6F9E8F',
  '#9B8AA8',
  '#B08999',
  '#8E8B86',
  '#A3B18A',
  '#D4A373',
];

export const HOUSEHOLD_TIMEZONES = [
  { value: 'America/Phoenix', label: 'Arizona (Phoenix)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/New_York', label: 'Eastern (New York)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
];
