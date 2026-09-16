import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils/uuid';
import {
  isSavingsKind,
  type SavingsAccount,
  type SavingsAccountDraft,
} from '@/lib/savings/model';

interface SavingsState {
  goalCents: number;
  accounts: SavingsAccount[];
  setGoalCents: (cents: number) => void;
  addAccount: (draft: SavingsAccountDraft) => void;
  updateAccount: (id: string, draft: SavingsAccountDraft) => void;
  removeAccount: (id: string) => void;
}

function cleanDraft(draft: SavingsAccountDraft): Omit<SavingsAccount, 'id' | 'updatedAt'> {
  return {
    name: draft.name.trim(),
    location: draft.location.trim(),
    kind: isSavingsKind(draft.kind) ? draft.kind : 'other',
    amountCents: Math.max(0, Math.round(draft.amountCents)),
    notes: draft.notes.trim(),
  };
}

function normalizeAccounts(raw: unknown): SavingsAccount[] {
  if (!Array.isArray(raw)) return [];
  const next: SavingsAccount[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<SavingsAccount>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string') continue;
    next.push({
      id: row.id,
      name: row.name,
      location: typeof row.location === 'string' ? row.location : '',
      kind: isSavingsKind(row.kind ?? '') ? row.kind : 'other',
      amountCents: typeof row.amountCents === 'number' && Number.isFinite(row.amountCents)
        ? Math.max(0, Math.round(row.amountCents))
        : 0,
      notes: typeof row.notes === 'string' ? row.notes : '',
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
    });
  }
  return next;
}

function normalizeGoal(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return 0;
  return Math.round(raw);
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set) => ({
      goalCents: 0,
      accounts: [],
      setGoalCents: (cents) => set({ goalCents: Math.max(0, Math.round(cents)) }),
      addAccount: (draft) => {
        const cleaned = cleanDraft(draft);
        if (!cleaned.name) return;
        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              ...cleaned,
              id: generateUUID(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
      },
      updateAccount: (id, draft) => {
        const cleaned = cleanDraft(draft);
        if (!cleaned.name) return;
        set((state) => ({
          accounts: state.accounts.map((account) => (
            account.id === id
              ? { ...account, ...cleaned, updatedAt: new Date().toISOString() }
              : account
          )),
        }));
      },
      removeAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((account) => account.id !== id),
        }));
      },
    }),
    {
      name: 'savings-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SavingsState> | undefined;
        return {
          ...currentState,
          ...persisted,
          goalCents: normalizeGoal(persisted?.goalCents),
          accounts: normalizeAccounts(persisted?.accounts),
        };
      },
    },
  ),
);
