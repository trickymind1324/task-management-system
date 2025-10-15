// ABOUTME: Modal component for creating new tasks with form validation
// ABOUTME: Includes title, description, priority, status, due date, tags, and assignee selection

'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/lib/store/task-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { apiClient } from '@/lib/api/client';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { UserAvatar } from '../common/UserAvatar';
import { TaskPriority, TaskStatus, CreateTaskDTO, User } from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { createTask } = useTaskStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as TaskPriority,
    status: 'To Do' as TaskStatus,
    due_date: '',
    tags: '',
    assignees: [] as string[],
    is_recurring: false,
    recurrence: {
      frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      interval: 1,
      daysOfWeek: [] as number[],
      endCondition: 'never' as 'never' | 'on_date' | 'after_occurrences',
      endDate: '',
      occurrences: 10,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await apiClient.getUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const taskData: CreateTaskDTO = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      creator: user.user_id,
      assignees: formData.assignees,
      department: user.department,
      due_date: formData.due_date ? new Date(formData.due_date) : null,
      project: null,
      dependencies: [],
      blocks: [],
      parent_task: null,
      source: 'GUI' as const,
      attachments: [],
      tags: formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
      confidence_score: null,
      metadata: {},
    };

    try {
      await createTask(taskData);

      addNotification({
        type: 'success',
        title: 'Task created',
        message: `"${formData.title}" has been created successfully`,
        duration: 4000,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        due_date: '',
        tags: '',
        assignees: [],
        is_recurring: false,
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [],
          endCondition: 'never',
          endDate: '',
          occurrences: 10,
        },
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create task',
        message: error instanceof Error ? error.message : 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        due_date: '',
        tags: '',
        assignees: [],
        is_recurring: false,
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [],
          endCondition: 'never',
          endDate: '',
          occurrences: 10,
        },
      });
      onClose();
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        daysOfWeek: prev.recurrence.daysOfWeek.includes(day)
          ? prev.recurrence.daysOfWeek.filter(d => d !== day)
          : [...prev.recurrence.daysOfWeek, day].sort(),
      },
    }));
  };

  const toggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-slate-900">
            Task Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task title"
            className="mt-1 bg-white text-slate-900 border-slate-300"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-slate-900">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the task in detail..."
            className="mt-1 bg-white text-slate-900 border-slate-300"
            rows={4}
          />
        </div>

        {/* Priority and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority" className="text-slate-900">Priority</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <Label htmlFor="status" className="text-slate-900">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Blocked">Blocked</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <Label htmlFor="due_date" className="text-slate-900">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="mt-1 bg-white text-slate-900 border-slate-300"
          />
        </div>

        {/* Recurring Task */}
        <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center gap-2">
            <input
              id="is_recurring"
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="rounded border-slate-300"
            />
            <Label htmlFor="is_recurring" className="text-slate-900 cursor-pointer">
              Make this a recurring task
            </Label>
          </div>

          {formData.is_recurring && (
            <div className="space-y-4 pl-6 border-l-2 border-blue-200">
              {/* Frequency and Interval */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency" className="text-slate-900">Frequency</Label>
                  <select
                    id="frequency"
                    value={formData.recurrence.frequency}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrence: {
                        ...formData.recurrence,
                        frequency: e.target.value as any,
                      }
                    })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="interval" className="text-slate-900">Every</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="interval"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.recurrence.interval}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrence: {
                          ...formData.recurrence,
                          interval: parseInt(e.target.value) || 1,
                        }
                      })}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                    />
                    <span className="text-sm text-slate-600">
                      {formData.recurrence.frequency === 'daily' && 'day(s)'}
                      {formData.recurrence.frequency === 'weekly' && 'week(s)'}
                      {formData.recurrence.frequency === 'monthly' && 'month(s)'}
                      {formData.recurrence.frequency === 'yearly' && 'year(s)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Days of Week (Weekly only) */}
              {formData.recurrence.frequency === 'weekly' && (
                <div>
                  <Label className="text-slate-900">Repeat on</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOfWeek(index)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          formData.recurrence.daysOfWeek.includes(index)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* End Condition */}
              <div>
                <Label className="text-slate-900">End condition</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="endCondition"
                      checked={formData.recurrence.endCondition === 'never'}
                      onChange={() => setFormData({
                        ...formData,
                        recurrence: {
                          ...formData.recurrence,
                          endCondition: 'never',
                        }
                      })}
                      className="border-slate-300"
                    />
                    <span className="text-sm text-slate-900">Never</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="endCondition"
                      checked={formData.recurrence.endCondition === 'on_date'}
                      onChange={() => setFormData({
                        ...formData,
                        recurrence: {
                          ...formData.recurrence,
                          endCondition: 'on_date',
                        }
                      })}
                      className="border-slate-300"
                    />
                    <span className="text-sm text-slate-900">On</span>
                    <Input
                      type="date"
                      value={formData.recurrence.endDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrence: {
                          ...formData.recurrence,
                          endDate: e.target.value,
                          endCondition: 'on_date',
                        }
                      })}
                      disabled={formData.recurrence.endCondition !== 'on_date'}
                      className="w-40 bg-white text-slate-900 border-slate-300 disabled:opacity-50"
                    />
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="endCondition"
                      checked={formData.recurrence.endCondition === 'after_occurrences'}
                      onChange={() => setFormData({
                        ...formData,
                        recurrence: {
                          ...formData.recurrence,
                          endCondition: 'after_occurrences',
                        }
                      })}
                      className="border-slate-300"
                    />
                    <span className="text-sm text-slate-900">After</span>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={formData.recurrence.occurrences}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrence: {
                          ...formData.recurrence,
                          occurrences: parseInt(e.target.value) || 1,
                          endCondition: 'after_occurrences',
                        }
                      })}
                      disabled={formData.recurrence.endCondition !== 'after_occurrences'}
                      className="w-20 px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 bg-white disabled:opacity-50"
                    />
                    <span className="text-sm text-slate-900">occurrences</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <Label htmlFor="tags" className="text-slate-900">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., frontend, urgent, bug-fix"
            className="mt-1 bg-white text-slate-900 border-slate-300"
          />
          <p className="mt-1 text-xs text-slate-600">Separate multiple tags with commas</p>
        </div>

        {/* Assignees */}
        <div>
          <Label className="text-slate-900">Assign to</Label>
          <div className="mt-2 space-y-2 border border-slate-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
            {allUsers.map((u) => (
              <label key={u.user_id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.assignees.includes(u.user_id)}
                  onChange={() => toggleAssignee(u.user_id)}
                  className="rounded border-slate-300"
                />
                <UserAvatar userId={u.user_id} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-900">{u.full_name}</span>
                  <span className="text-xs text-slate-600 ml-2">({u.role})</span>
                </div>
              </label>
            ))}
          </div>
          {formData.assignees.length > 0 && (
            <p className="mt-1 text-xs text-slate-600">
              {formData.assignees.length} assignee{formData.assignees.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
