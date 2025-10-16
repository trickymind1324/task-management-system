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

class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_CONFIG.timeout);

  try {
    const token = TokenManager.getAccessToken();
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
  // Authentication methods
  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await apiRequest<{ user: User; access_token: string; refresh_token: string }>(
      API_ENDPOINTS.auth.login,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    TokenManager.setTokens(response.access_token, response.refresh_token);

    return {
      user: response.user,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    department_id?: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await apiRequest<{ user: User; access_token: string; refresh_token: string }>(
      API_ENDPOINTS.auth.register,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    TokenManager.setTokens(response.access_token, response.refresh_token);

    return {
      user: response.user,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    };
  }

  async logout(): Promise<void> {
    try {
      await apiRequest(API_ENDPOINTS.auth.logout, {
        method: 'POST',
      });
    } finally {
      TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiRequest<User>(API_ENDPOINTS.auth.me);
    } catch (error) {
      if (error instanceof APIError && error.status === 401) {
        TokenManager.clearTokens();
        return null;
      }
      throw error;
    }
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return null;

      const response = await apiRequest<{ access_token: string; refresh_token: string }>(
        API_ENDPOINTS.auth.refresh,
        {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      TokenManager.setTokens(response.access_token, response.refresh_token);

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
    } catch (error) {
      TokenManager.clearTokens();
      return null;
    }
  }

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
