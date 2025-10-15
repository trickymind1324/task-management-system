// ABOUTME: API configuration including base URLs, endpoints, and HTTP settings
// ABOUTME: Environment-based configuration for switching between mock and production backends

import { TaskFilters } from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
  tasks: `${API_BASE_URL}/tasks`,
  task: (id: string) => `${API_BASE_URL}/tasks/${id}`,
  users: `${API_BASE_URL}/users`,
  user: (id: string) => `${API_BASE_URL}/users/${id}`,
  departments: `${API_BASE_URL}/departments`,
  department: (id: string) => `${API_BASE_URL}/departments/${id}`,
  projects: `${API_BASE_URL}/projects`,
  project: (id: string) => `${API_BASE_URL}/projects/${id}`,
  comments: `${API_BASE_URL}/comments`,
  comment: (id: string) => `${API_BASE_URL}/comments/${id}`,
  taskComments: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/comments`,
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    me: `${API_BASE_URL}/auth/me`,
  },
};

export const HTTP_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
};

export function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export function buildTaskQueryParams(filters?: TaskFilters): string {
  if (!filters) return '';

  const params: Record<string, any> = {};

  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.assignees) params.assignees = filters.assignees;
  if (filters.department) params.department = filters.department;
  if (filters.project) params.project = filters.project;
  if (filters.search) params.search = filters.search;
  if (filters.tags) params.tags = filters.tags;
  if (filters.creator) params.creator = filters.creator;
  if (filters.source) params.source = filters.source;
  if (filters.due_date_from) params.due_date_from = filters.due_date_from.toISOString();
  if (filters.due_date_to) params.due_date_to = filters.due_date_to.toISOString();

  return buildQueryParams(params);
}
