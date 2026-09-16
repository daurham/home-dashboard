export const SAVINGS_KINDS = [
  { id: 'savings', label: 'Savings account' },
  { id: 'checking', label: 'Checking' },
  { id: 'cash', label: 'Cash' },
  { id: 'investment', label: 'Investment' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'other', label: 'Other' },
] as const;

export type SavingsKind = (typeof SAVINGS_KINDS)[number]['id'];

export const SAVINGS_KIND_COLORS: Record<SavingsKind, string> = {
  savings: '#34d399',
  checking: '#38bdf8',
  cash: '#fbbf24',
  investment: '#a78bfa',
  retirement: '#f472b6',
  other: '#94a3b8',
};

export interface SavingsAccount {
  id: string;
  name: string;
  location: string;
  kind: SavingsKind;
  amountCents: number;
  notes: string;
  updatedAt: string;
}

export interface SavingsAccountDraft {
  name: string;
  location: string;
  kind: SavingsKind;
  amountCents: number;
  notes: string;
}

export const SAVINGS_KIND_IDS = SAVINGS_KINDS.map((kind) => kind.id);

export function isSavingsKind(value: string): value is SavingsKind {
  return (SAVINGS_KIND_IDS as string[]).includes(value);
}

export function savingsKindLabel(kind: SavingsKind): string {
  return SAVINGS_KINDS.find((item) => item.id === kind)?.label ?? 'Other';
}

export function emptySavingsDraft(): SavingsAccountDraft {
  return {
    name: '',
    location: '',
    kind: 'savings',
    amountCents: 0,
    notes: '',
  };
}

export function draftFromAccount(account: SavingsAccount): SavingsAccountDraft {
  return {
    name: account.name,
    location: account.location,
    kind: account.kind,
    amountCents: account.amountCents,
    notes: account.notes,
  };
}

export function savingsTotalCents(accounts: SavingsAccount[]): number {
  return accounts.reduce((sum, account) => sum + Math.max(0, account.amountCents), 0);
}

export function savingsProgressPercent(totalCents: number, goalCents: number): number {
  if (goalCents <= 0) return 0;
  return Math.min(100, (Math.max(0, totalCents) / goalCents) * 100);
}

export function remainingToGoalCents(totalCents: number, goalCents: number): number {
  return goalCents - totalCents;
}
