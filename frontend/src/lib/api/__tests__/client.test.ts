// ABOUTME: Tests for the API client
// ABOUTME: Verifies HTTP request handling, error cases, and response parsing

import { ApiClient, APIError } from '../client';
import { Task, TaskStatus, TaskPriority } from '@/types';

global.fetch = jest.fn();

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockTasks: Task[] = [
        {
          task_id: 'task-1',
          title: 'Test Task',
          description: 'Test Description',
          status: 'To Do' as TaskStatus,
          priority: 'High' as TaskPriority,
          assignees: [],
          creator: 'user-1',
          department: null,
          creation_date: new Date(),
          due_date: null,
          completion_date: null,
          last_modified: new Date(),
          project: null,
          dependencies: [],
          blocks: [],
          parent_task: null,
          source: 'GUI',
          attachments: [],
          tags: [],
          confidence_score: null,
          comments: [],
          metadata: {},
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      const result = await client.getTasks();
      expect(result).toEqual(mockTasks);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Server error',
          },
        }),
      });

      await expect(client.getTasks()).rejects.toThrow(APIError);
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getTasks()).rejects.toThrow(APIError);
    });
  });

  describe('getTaskById', () => {
    it('should return null for 404', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { code: 'NOT_FOUND', message: 'Task not found' },
        }),
      });

      const result = await client.getTaskById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('createTask', () => {
    it('should create a task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Description',
        status: 'To Do' as TaskStatus,
        priority: 'Medium' as TaskPriority,
        assignees: [],
        creator: 'user-1',
        department: null,
        due_date: null,
        project: null,
        dependencies: [],
        blocks: [],
        parent_task: null,
        source: 'GUI' as const,
        attachments: [],
        tags: [],
        confidence_score: null,
        metadata: {},
      };

      const createdTask = {
        ...newTask,
        task_id: 'task-new',
        creation_date: new Date(),
        last_modified: new Date(),
        completion_date: null,
        comments: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdTask,
      });

      const result = await client.createTask(newTask);
      expect(result.task_id).toBe('task-new');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTask),
        })
      );
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const updates = { status: 'Done' as TaskStatus };
      const updatedTask = { task_id: 'task-1', ...updates } as Task;

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTask,
      });

      const result = await client.updateTask('task-1', updates);
      expect(result?.status).toBe('Done');
    });

    it('should return null for 404', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { code: 'NOT_FOUND', message: 'Task not found' },
        }),
      });

      const result = await client.updateTask('non-existent', { status: 'Done' });
      expect(result).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await client.deleteTask('task-1');
      expect(result).toBe(true);
    });

    it('should return false for 404', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { code: 'NOT_FOUND', message: 'Task not found' },
        }),
      });

      const result = await client.deleteTask('non-existent');
      expect(result).toBe(false);
    });
  });
});
