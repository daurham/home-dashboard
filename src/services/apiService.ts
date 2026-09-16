/**
 * Base API service for communicating with the home-ai backend
 * All database operations go through this service
 */

import type {
  LatencySnapshot,
  LatencyTargetConfig,
  LatencyTargetSnapshot,
  LatencyTargetWriteBody,
} from '@/lib/latency/format';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `API ${response.status} ${response.statusText || ''}`.trim(),
    }));
    throw new Error(error.error || error.details || `HTTP ${response.status}`);
  }

  return response.json();
}

// Modules API
export const modulesApi = {
  getAll: () => apiRequest<any[]>('/modules'),
  getById: (id: string) => apiRequest<any>(`/modules/${id}`),
  getByName: (name: string) => apiRequest<any>(`/modules/name/${name}`),
  create: (data: any) => apiRequest<any>('/modules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<any>(`/modules/${id}`, { method: 'DELETE' }),
};

// Module Instances API
export const moduleInstancesApi = {
  getAll: () => apiRequest<any[]>('/module-instances'),
  getById: (id: string) => apiRequest<any>(`/module-instances/${id}`),
  getByModuleName: (moduleName: string) => apiRequest<any[]>(`/module-instances/module/${moduleName}`),
  create: (data: any) => apiRequest<any>('/module-instances', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/module-instances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<any>(`/module-instances/${id}`, { method: 'DELETE' }),
};

// Module Data API
export const moduleDataApi = {
  getByInstanceId: (instanceId: string) => apiRequest<any[]>(`/module-data/instance/${instanceId}`),
  getSingleByInstanceId: (instanceId: string) => apiRequest<any>(`/module-data/instance/${instanceId}/single`),
  getById: (id: string) => apiRequest<any>(`/module-data/${id}`),
  create: (data: any) => apiRequest<any>('/module-data', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/module-data/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify({ data })  // API expects { data: ... }
  }),
  patch: (id: string, path: string[], value: any) => apiRequest<any>(`/module-data/${id}`, { 
    method: 'PATCH', 
    body: JSON.stringify({ path, value }) 
  }),
  delete: (id: string) => apiRequest<any>(`/module-data/${id}`, { method: 'DELETE' }),
};

// Calendar API
export const calendarApi = {
  getAll: () => apiRequest<any[]>('/calendar'),
  getById: (id: string) => apiRequest<any>(`/calendar/${id}`),
  getByRange: (start: string, end: string) => apiRequest<any[]>(`/calendar/range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  getWeek: () => apiRequest<any[]>('/calendar/week'),
  create: (data: any) => apiRequest<any>('/calendar', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<any>(`/calendar/${id}`, { method: 'DELETE' }),
};

export interface ExpenseListQuery {
  from?: string;
  to?: string;
  weekKey?: string;
  month?: string;
  timeZone?: string;
}

export interface ExpenseSummaryQuery {
  grain?: 'week' | 'month';
  from?: string;
  to?: string;
  weekKey?: string;
  month?: string;
  timeZone?: string;
}

export interface DbExpenseRow {
  id: string;
  amount_cents: number;
  currency: string;
  category_id: string;
  note: string | null;
  paid_by: string | null;
  occurred_on: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category_name: string;
  category_color: string;
}

export interface DbCategoryRow {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExpenseSummary {
  grain: 'week' | 'month';
  timeZone: string;
  from: string;
  to: string;
  selected_period_total_cents: number;
  weekly_budget_cents?: number;
  remaining_cents?: number | null;
  periods: Array<{ key: string; start: string; end: string; total_cents: number }>;
  categories: Array<{ category_id: string; name: string; color: string; total_cents: number }>;
}

export interface DbExpenseSettings {
  id: number;
  weekly_budget_cents: number;
  currency: string;
  updated_at: string;
}

export interface ExpenseWriteBody {
  amount_cents?: number;
  currency?: string;
  category_id?: string;
  note?: string | null;
  paid_by?: string | null;
  occurred_on?: string;
  timeZone?: string;
}

export interface CategoryWriteBody {
  name?: string;
  color?: string;
  sort_order?: number;
  archived?: boolean;
  archived_at?: null;
}

function toQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export const expensesApi = {
  list: (params: ExpenseListQuery = {}) =>
    apiRequest<DbExpenseRow[]>(`/expenses${toQuery(params as Record<string, string | undefined>)}`),
  getById: (id: string) => apiRequest<DbExpenseRow>(`/expenses/${id}`),
  create: (data: ExpenseWriteBody) =>
    apiRequest<DbExpenseRow>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: ExpenseWriteBody) =>
    apiRequest<DbExpenseRow>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<{ message: string; id: string }>(`/expenses/${id}`, { method: 'DELETE' }),
  restore: (id: string) =>
    apiRequest<DbExpenseRow>(`/expenses/${id}/restore`, { method: 'POST' }),
  summary: (params: ExpenseSummaryQuery = {}) =>
    apiRequest<DbExpenseSummary>(`/expenses/summary${toQuery(params as Record<string, string | undefined>)}`),
};

export const latencyApi = {
  snapshot: () => apiRequest<LatencySnapshot>('/latency/snapshot'),
  forceCheck: (id: string) =>
    apiRequest<LatencyTargetSnapshot>(`/latency/check/${encodeURIComponent(id)}`, {
      method: 'POST',
    }),
  listTargets: () => apiRequest<LatencyTargetConfig[]>('/latency/targets'),
  createTarget: (data: LatencyTargetWriteBody) =>
    apiRequest<LatencyTargetConfig>('/latency/targets', { method: 'POST', body: JSON.stringify(data) }),
  updateTarget: (id: string, data: Partial<LatencyTargetWriteBody>) =>
    apiRequest<LatencyTargetConfig>(`/latency/targets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTarget: (id: string) =>
    apiRequest<{ message: string; id: string }>(`/latency/targets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

export const expenseCategoriesApi = {
  list: (includeArchived = false) =>
    apiRequest<DbCategoryRow[]>(`/expense-categories${includeArchived ? '?includeArchived=true' : ''}`),
  create: (data: CategoryWriteBody) =>
    apiRequest<DbCategoryRow>('/expense-categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: CategoryWriteBody) =>
    apiRequest<DbCategoryRow>(`/expense-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const expenseSettingsApi = {
  get: () => apiRequest<DbExpenseSettings>('/expense-settings'),
  update: (data: { weekly_budget_cents?: number; weekly_budget?: number }) =>
    apiRequest<DbExpenseSettings>('/expense-settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

