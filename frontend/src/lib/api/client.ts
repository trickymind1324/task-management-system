// ABOUTME: HTTP client for all API requests with error handling and retries
// ABOUTME: Provides typed methods for tasks, users, departments, projects, and comments with JWT authentication

import { API_ENDPOINTS, HTTP_CONFIG, buildTaskQueryParams } from './config';
import {
  Task,
  User,
  Department,
  Project,
  Comment,
  CreateTaskDTO,
  UpdateTaskDTO,
  CreateCommentDTO,
  TaskFilters,
  APIResponse,
} from '@/types';
import { authService } from '../auth/auth';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_CONFIG.timeout);

  try {
    const token = authService.getAccessToken();
    const headers: HeadersInit = {
      ...HTTP_CONFIG.headers,
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      throw new APIError(
        errorData.error?.message || errorData.message || 'An error occurred',
        response.status,
        errorData.error?.code,
        errorData.error?.details
      );
    }

    const data = await response.json();

    // Handle Go backend response format: { success: true, data: {...} }
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data.data as T;
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408);
      }
      throw new APIError(error.message, 0);
    }

    throw new APIError('Unknown error occurred', 0);
  }
}

export class ApiClient {
  // Note: Authentication methods are handled by authService
  // This client focuses on resource management (tasks, users, etc.)

  // Task methods
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const queryParams = buildTaskQueryParams(filters);
    return apiRequest<Task[]>(`${API_ENDPOINTS.tasks}${queryParams}`);
  }

  async getTaskById(id: string): Promise<Task | null> {
    try {
      return await apiRequest<Task>(API_ENDPOINTS.task(id));
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    return apiRequest<Task>(API_ENDPOINTS.tasks, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, updates: UpdateTaskDTO): Promise<Task | null> {
    try {
      return await apiRequest<Task>(API_ENDPOINTS.task(id), {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      await apiRequest(API_ENDPOINTS.task(id), {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    return apiRequest<User[]>(API_ENDPOINTS.users);
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await apiRequest<User>(API_ENDPOINTS.user(id));
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getDepartments(): Promise<Department[]> {
    return apiRequest<Department[]>(API_ENDPOINTS.departments);
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      return await apiRequest<Department>(API_ENDPOINTS.department(id));
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getProjects(): Promise<Project[]> {
    return apiRequest<Project[]>(API_ENDPOINTS.projects);
  }

  async getProjectById(id: string): Promise<Project | null> {
    try {
      return await apiRequest<Project>(API_ENDPOINTS.project(id));
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getTaskComments(taskId: string): Promise<Comment[]> {
    try {
      return await apiRequest<Comment[]>(API_ENDPOINTS.taskComments(taskId));
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async addComment(taskId: string, commentData: CreateCommentDTO): Promise<Comment> {
    return apiRequest<Comment>(API_ENDPOINTS.taskComments(taskId), {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async updateComment(id: string, content: string): Promise<Comment | null> {
    try {
      return await apiRequest<Comment>(API_ENDPOINTS.comment(id), {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteComment(id: string): Promise<boolean> {
    try {
      await apiRequest(API_ENDPOINTS.comment(id), {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export { APIError };
