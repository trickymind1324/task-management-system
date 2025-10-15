// ABOUTME: Zustand store for task state management and operations
// ABOUTME: Handles task list, filters, CRUD operations, and selected task

import { create } from 'zustand';
import { Task, TaskFilters, UpdateTaskDTO, CreateTaskDTO } from '@/types';
import { apiClient } from '../api/client';

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  selectedTaskId: string | null;
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  createTask: (task: CreateTaskDTO) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setSelectedTask: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;
  clearError: () => void;
}

const applyFilters = (tasks: Task[], filters: TaskFilters): Task[] => {
  return tasks.filter(task => {
    if (filters.status && !filters.status.includes(task.status)) return false;
    if (filters.priority && !filters.priority.includes(task.priority)) return false;
    if (filters.assignees && !filters.assignees.some(a => task.assignees.includes(a))) return false;
    if (filters.department && task.department !== filters.department) return false;
    if (filters.project && task.project !== filters.project) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description?.toLowerCase().includes(searchLower);
      const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      if (!matchesTitle && !matchesDescription && !matchesTags) return false;
    }
    return true;
  });
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  get filteredTasks() {
    return applyFilters(get().tasks, get().filters);
  },
  selectedTaskId: null,
  filters: {},
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await apiClient.getTasks(get().filters);
      set({ tasks, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set({ error: message, isLoading: false });
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await apiClient.createTask(taskData);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
      return newTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiClient.updateTask(id, updates);
      if (updated) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.task_id === id ? updated : t)),
          isLoading: false,
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.task_id !== id),
        selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchTasks();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchTasks();
  },

  setSelectedTask: (id) => {
    set({ selectedTaskId: id });
  },

  getTaskById: (id) => {
    return get().tasks.find((t) => t.task_id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));
