import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Purchase {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
}

interface BudgetData {
  weeklyBudget: number;
  purchases: Purchase[];
}

interface BudgetState {
  budgets: Record<string, BudgetData>; // Keyed by slot identifier
  setWeeklyBudget: (slotId: string, amount: number) => void;
  addPurchase: (slotId: string, purchase: Omit<Purchase, 'id'>) => void;
  updatePurchase: (slotId: string, id: string, updates: Partial<Purchase>) => void;
  removePurchase: (slotId: string, id: string) => void;
  clearAllPurchases: (slotId: string) => void;
  getRemainingBudget: (slotId: string) => number;
  getTotalSpent: (slotId: string) => number;
  getBudgetData: (slotId: string) => BudgetData;
}

const getDefaultBudgetData = (): BudgetData => ({
  weeklyBudget: 500,
  purchases: [],
});

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: {},
      setWeeklyBudget: (slotId, amount) =>
        set((state) => {
          const budget = state.budgets[slotId] || getDefaultBudgetData();
          return {
            budgets: {
              ...state.budgets,
              [slotId]: { ...budget, weeklyBudget: amount },
            },
          };
        }),
      addPurchase: (slotId, purchase) =>
        set((state) => {
          const budget = state.budgets[slotId] || getDefaultBudgetData();
          return {
            budgets: {
              ...state.budgets,
              [slotId]: {
                ...budget,
                purchases: [
                  ...budget.purchases,
                  {
                    ...purchase,
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  },
                ],
              },
            },
          };
        }),
      updatePurchase: (slotId, id, updates) =>
        set((state) => {
          const budget = state.budgets[slotId] || getDefaultBudgetData();
          return {
            budgets: {
              ...state.budgets,
              [slotId]: {
                ...budget,
                purchases: budget.purchases.map((p) => (p.id === id ? { ...p, ...updates } : p)),
              },
            },
          };
        }),
      removePurchase: (slotId, id) =>
        set((state) => {
          const budget = state.budgets[slotId] || getDefaultBudgetData();
          return {
            budgets: {
              ...state.budgets,
              [slotId]: {
                ...budget,
                purchases: budget.purchases.filter((p) => p.id !== id),
              },
            },
          };
        }),
      clearAllPurchases: (slotId) =>
        set((state) => {
          const budget = state.budgets[slotId] || getDefaultBudgetData();
          return {
            budgets: {
              ...state.budgets,
              [slotId]: {
                ...budget,
                purchases: [],
              },
            },
          };
        }),
      getRemainingBudget: (slotId) => {
        const state = get();
        const budget = state.budgets[slotId] || getDefaultBudgetData();
        return budget.weeklyBudget - budget.purchases.reduce((sum, p) => sum + p.amount, 0);
      },
      getTotalSpent: (slotId) => {
        const state = get();
        const budget = state.budgets[slotId] || getDefaultBudgetData();
        return budget.purchases.reduce((sum, p) => sum + p.amount, 0);
      },
      getBudgetData: (slotId) => {
        const state = get();
        return state.budgets[slotId] || getDefaultBudgetData();
      },
    }),
    {
      name: 'budget-storage',
    }
  )
);

