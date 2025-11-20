/**
 * Base API service for communicating with the home-ai backend
 * All database operations go through this service
 */

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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
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

