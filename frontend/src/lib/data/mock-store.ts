// ABOUTME: Mock data store layer providing abstraction over API client
// ABOUTME: Delegates all data operations to API client for consistent data access

import {
  Task,
  User,
  Department,
  Project,
  Comment,
  TaskFilters,
  CreateTaskDTO,
  CreateCommentDTO,
  UpdateTaskDTO
} from '@/types';
import { apiClient } from '../api/client';

class MockDataStore {
  // ============================================================================
  // TASKS
  // ============================================================================

  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    return apiClient.getTasks(filters);
  }

  async getTaskById(id: string): Promise<Task | null> {
    return apiClient.getTaskById(id);
  }

  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    return apiClient.createTask(taskData);
  }

  async updateTask(id: string, updates: UpdateTaskDTO): Promise<Task | null> {
    return apiClient.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    return apiClient.deleteTask(id);
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async getUsers(): Promise<User[]> {
    return apiClient.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return apiClient.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await apiClient.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // ============================================================================
  // DEPARTMENTS
  // ============================================================================

  async getDepartments(): Promise<Department[]> {
    return apiClient.getDepartments();
  }

  // ============================================================================
  // PROJECTS
  // ============================================================================

  async getProjects(): Promise<Project[]> {
    return apiClient.getProjects();
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================

  async getTaskComments(taskId: string): Promise<Comment[]> {
    return apiClient.getTaskComments(taskId);
  }

  async addComment(taskId: string, commentData: CreateCommentDTO): Promise<Comment> {
    return apiClient.addComment(taskId, commentData);
  }
}

// Export singleton instance
export const mockDataStore = new MockDataStore();
