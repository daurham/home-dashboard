import {
  expenseCategoriesApi,
  expenseSettingsApi,
  expensesApi,
  type DbCategoryRow,
  type DbExpenseRow,
  type DbExpenseSummary,
  type ExpenseListQuery,
  type ExpenseSummaryQuery,
  type ExpenseWriteBody,
} from './apiService';
import { DEFAULT_WEEKLY_BUDGET_CENTS } from '@/lib/expenses/constants';
import { remainingCents } from '@/lib/expenses/money';

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  archivedAt: string | null;
}

export interface Expense {
  id: string;
  amountCents: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  note?: string;
  paidBy?: string;
  occurredOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummaryPeriod {
  key: string;
  start: string;
  end: string;
  totalCents: number;
}

export interface ExpenseSummaryCategory {
  categoryId: string;
  name: string;
  color: string;
  totalCents: number;
}

export interface ExpenseSummary {
  grain: 'week' | 'month';
  timeZone: string;
  from: string;
  to: string;
  selectedPeriodTotalCents: number;
  weeklyBudgetCents: number;
  remainingCents: number | null;
  periods: ExpenseSummaryPeriod[];
  categories: ExpenseSummaryCategory[];
}

function mapCategory(row: DbCategoryRow): ExpenseCategory {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at ?? null,
  };
}

function mapExpense(row: DbExpenseRow): Expense {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    currency: row.currency,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryColor: row.category_color,
    note: row.note || undefined,
    paidBy: row.paid_by || undefined,
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSummary(row: DbExpenseSummary): ExpenseSummary {
  const weeklyBudgetCents = row.weekly_budget_cents ?? DEFAULT_WEEKLY_BUDGET_CENTS;
  const remaining = row.grain === 'week'
    ? (row.remaining_cents ?? remainingCents(weeklyBudgetCents, row.selected_period_total_cents))
    : (row.remaining_cents ?? null);

  return {
    grain: row.grain,
    timeZone: row.timeZone,
    from: row.from,
    to: row.to,
    selectedPeriodTotalCents: row.selected_period_total_cents,
    weeklyBudgetCents,
    remainingCents: remaining,
    periods: row.periods.map((period) => ({
      key: period.key,
      start: period.start,
      end: period.end,
      totalCents: period.total_cents,
    })),
    categories: row.categories.map((category) => ({
      categoryId: category.category_id,
      name: category.name,
      color: category.color,
      totalCents: category.total_cents,
    })),
  };
}

export async function listExpenses(params: ExpenseListQuery = {}): Promise<Expense[]> {
  const rows = await expensesApi.list(params);
  return rows.map(mapExpense);
}

export async function createExpense(data: ExpenseWriteBody): Promise<Expense> {
  return mapExpense(await expensesApi.create(data));
}

export async function updateExpense(id: string, data: ExpenseWriteBody): Promise<Expense> {
  return mapExpense(await expensesApi.update(id, data));
}

export async function deleteExpense(id: string): Promise<void> {
  await expensesApi.delete(id);
}

export async function restoreExpense(id: string): Promise<Expense> {
  return mapExpense(await expensesApi.restore(id));
}

export async function getExpenseSummary(params: ExpenseSummaryQuery = {}): Promise<ExpenseSummary> {
  return mapSummary(await expensesApi.summary(params));
}

export async function listExpenseCategories(includeArchived = false): Promise<ExpenseCategory[]> {
  const rows = await expenseCategoriesApi.list(includeArchived);
  return rows.map(mapCategory);
}

export async function createExpenseCategory(data: { name: string; color: string }): Promise<ExpenseCategory> {
  return mapCategory(await expenseCategoriesApi.create(data));
}

export async function updateExpenseCategory(
  id: string,
  data: { name?: string; color?: string; archived?: boolean; archived_at?: null },
): Promise<ExpenseCategory> {
  return mapCategory(await expenseCategoriesApi.update(id, data));
}

export async function updateWeeklyBudget(weeklyBudgetCents: number): Promise<number> {
  const settings = await expenseSettingsApi.update({ weekly_budget_cents: weeklyBudgetCents });
  return settings.weekly_budget_cents;
}
