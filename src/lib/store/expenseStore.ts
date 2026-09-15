import { create } from 'zustand';
import * as expenseService from '@/services/expenseService';
import type { Expense, ExpenseCategory, ExpenseSummary } from '@/services/expenseService';
import { DEFAULT_EXPENSE_TIMEZONE, getExpenseMonthRange, getExpenseWeekRange, todayYmd } from '@/lib/expenses/weekRange';

export type { Expense, ExpenseCategory, ExpenseSummary };

export type ExpenseGrain = 'week' | 'month';
export type ChartMode = 'trend' | 'breakdown';

interface ExpenseState {
  timeZone: string;
  grain: ExpenseGrain;
  chartMode: ChartMode;
  selectedWeekKey: string;
  selectedMonthKey: string;
  expenses: Expense[];
  categories: ExpenseCategory[];
  summary: ExpenseSummary | null;
  isLoading: boolean;
  load: (timeZone?: string) => Promise<void>;
  setGrain: (grain: ExpenseGrain) => void;
  setChartMode: (mode: ChartMode) => void;
  shiftPeriod: (delta: number) => void;
  goToCurrentPeriod: () => void;
  addExpense: (input: {
    amountCents: number;
    categoryId: string;
    note?: string;
    paidBy?: string | null;
    occurredOn?: string;
  }) => Promise<Expense>;
  editExpense: (id: string, input: Partial<{
    amountCents: number;
    categoryId: string;
    note: string | null;
    paidBy: string | null;
    occurredOn: string;
  }>) => Promise<Expense>;
  removeExpense: (id: string) => Promise<void>;
  restoreExpense: (id: string) => Promise<void>;
  addCategory: (name: string, color: string) => Promise<ExpenseCategory>;
  editCategory: (id: string, updates: { name?: string; color?: string; archived?: boolean }) => Promise<void>;
}

function currentKeys(timeZone: string) {
  const today = todayYmd(timeZone);
  return {
    weekKey: getExpenseWeekRange(today, timeZone).weekKey,
    monthKey: getExpenseMonthRange(today, timeZone).monthKey,
  };
}

function shiftIsoDate(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

function shiftMonth(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const useExpenseStore = create<ExpenseState>()((set, get) => ({
  timeZone: DEFAULT_EXPENSE_TIMEZONE,
  grain: 'week',
  chartMode: 'trend',
  selectedWeekKey: currentKeys(DEFAULT_EXPENSE_TIMEZONE).weekKey,
  selectedMonthKey: currentKeys(DEFAULT_EXPENSE_TIMEZONE).monthKey,
  expenses: [],
  categories: [],
  summary: null,
  isLoading: false,

  load: async (timeZone) => {
    const state = get();
    const tz = timeZone || state.timeZone;
    const keys = currentKeys(tz);
    const weekKey = timeZone && timeZone !== state.timeZone ? keys.weekKey : state.selectedWeekKey;
    const monthKey = timeZone && timeZone !== state.timeZone ? keys.monthKey : state.selectedMonthKey;

    set({ isLoading: true, timeZone: tz, selectedWeekKey: weekKey, selectedMonthKey: monthKey });

    try {
      const grain = get().grain;
      const listParams = grain === 'week'
        ? { weekKey, timeZone: tz }
        : { month: monthKey, timeZone: tz };
      const summaryParams = {
        grain,
        weekKey,
        month: monthKey,
        timeZone: tz,
      };

      const [expenses, categories, summary] = await Promise.all([
        expenseService.listExpenses(listParams),
        expenseService.listExpenseCategories(true),
        expenseService.getExpenseSummary(summaryParams),
      ]);

      set({ expenses, categories, summary, isLoading: false });
    } catch (error) {
      console.error('Error loading expenses:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  setGrain: (grain) => {
    set({ grain });
    void get().load().catch((error) => console.error(error));
  },

  setChartMode: (chartMode) => set({ chartMode }),

  shiftPeriod: (delta) => {
    const { grain, selectedWeekKey, selectedMonthKey } = get();
    if (grain === 'week') {
      set({ selectedWeekKey: shiftIsoDate(selectedWeekKey, delta * 7) });
    } else {
      set({ selectedMonthKey: shiftMonth(selectedMonthKey, delta) });
    }
    get().load().catch((error) => console.error(error));
  },

  goToCurrentPeriod: () => {
    const keys = currentKeys(get().timeZone);
    set({ selectedWeekKey: keys.weekKey, selectedMonthKey: keys.monthKey });
    get().load().catch((error) => console.error(error));
  },

  addExpense: async (input) => {
    const { timeZone } = get();
    const created = await expenseService.createExpense({
      amount_cents: input.amountCents,
      category_id: input.categoryId,
      note: input.note || null,
      paid_by: input.paidBy ?? null,
      occurred_on: input.occurredOn || todayYmd(timeZone),
      timeZone,
    });
    await get().load();
    return created;
  },

  editExpense: async (id, input) => {
    const updated = await expenseService.updateExpense(id, {
      amount_cents: input.amountCents,
      category_id: input.categoryId,
      note: input.note,
      paid_by: input.paidBy,
      occurred_on: input.occurredOn,
      timeZone: get().timeZone,
    });
    await get().load();
    return updated;
  },

  removeExpense: async (id) => {
    await expenseService.deleteExpense(id);
    set((state) => ({ expenses: state.expenses.filter((expense) => expense.id !== id) }));
    await get().load();
  },

  restoreExpense: async (id) => {
    await expenseService.restoreExpense(id);
    await get().load();
  },

  addCategory: async (name, color) => {
    const created = await expenseService.createExpenseCategory({ name, color });
    set((state) => ({ categories: [...state.categories, created] }));
    return created;
  },

  editCategory: async (id, updates) => {
    const updated = await expenseService.updateExpenseCategory(id, updates);
    set((state) => ({
      categories: state.categories.map((category) => (category.id === id ? updated : category)),
    }));
    await get().load();
  },
}));
