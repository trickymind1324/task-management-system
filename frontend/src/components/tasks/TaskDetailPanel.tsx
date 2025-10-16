// ABOUTME: Task detail side drawer panel for viewing and editing task details
// ABOUTME: Includes inline editing, comments, assignees, and delete functionality
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTaskStore } from '@/lib/store/task-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { apiClient } from '@/lib/api/client';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { UserAvatar } from '../common/UserAvatar';
import { DepartmentBadge } from '../common/DepartmentBadge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';
import { Task, User, TaskStatus, TaskPriority } from '@/types';

export function TaskDetailPanel() {
  const { selectedTaskId, setSelectedTask, updateTask, deleteTask, getTaskById } = useTaskStore();
  const user = useAuthStore(state => state.user);
  const { addNotification } = useNotificationStore();
  const [task, setTask] = useState<Task | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const loadTask = async () => {
      if (selectedTaskId) {
        const taskData = getTaskById(selectedTaskId);
        if (taskData) {
          setTask(taskData);
          setEditedTask({});
          setIsEditing(false);
        }
      } else {
        setTask(null);
      }
    };
    loadTask();
  }, [selectedTaskId, getTaskById]);

  const handleClose = useCallback(() => {
    setSelectedTask(null);
    setIsEditing(false);
    setEditedTask({});
  }, [setSelectedTask]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (selectedTaskId) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedTaskId, handleClose]);

  if (!selectedTaskId || !task) {
    return null;
  }

  const handleSave = async () => {
    if (Object.keys(editedTask).length > 0) {
      await updateTask(task.task_id, editedTask);
      const updatedTask = getTaskById(task.task_id);
      if (updatedTask) {
        setTask(updatedTask);
      }

      addNotification({
        type: 'success',
        title: 'Task updated',
        message: `"${task.title}" has been updated successfully`,
        duration: 3000,
      });
    }
    setIsEditing(false);
    setEditedTask({});
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      const taskTitle = task.title;
      await deleteTask(task.task_id);

      addNotification({
        type: 'success',
        title: 'Task deleted',
        message: `"${taskTitle}" has been deleted`,
        duration: 3000,
      });

      handleClose();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      await apiClient.addComment(task.task_id, {
        task_id: task.task_id,
        author: user.id,
        content: newComment.trim(),
      });

      const updatedTask = getTaskById(task.task_id);
      if (updatedTask) {
        setTask(updatedTask);
      }
      setNewComment('');

      addNotification({
        type: 'success',
        title: 'Comment added',
        duration: 2000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to add comment',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 3000,
      });
    }
  };

  const toggleAssignee = async (userId: string) => {
    const currentAssignees = editedTask.assignees ?? task.assignees;
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];

    setEditedTask({ ...editedTask, assignees: newAssignees });
  };

  const getFieldValue = <K extends keyof Task>(field: K): Task[K] => {
    return (editedTask[field] ?? task[field]) as Task[K];
  };

  const creator = allUsers.find(u => u.id === task.creator);

  return (
    <div
      ref={panelRef}
      className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[600px] bg-white shadow-2xl z-[90] flex flex-col border-l border-slate-200"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Task Details</h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className='text-sm text-slate-700 hover:bg-slate-100' size="sm" onClick={() => {
                setIsEditing(false);
                setEditedTask({});
              }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" className='text-sm text-slate-700 hover:bg-slate-100' size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <div>
          <Label className="text-slate-900">Title</Label>
          {isEditing ? (
            <input
              type="text"
              value={getFieldValue('title')}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h3 className="mt-1 text-xl font-semibold text-slate-900">{task.title}</h3>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-900">Status</Label>
            {isEditing ? (
              <select
                value={getFieldValue('status')}
                onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </select>
            ) : (
              <div className="mt-1">
                <StatusBadge status={task.status} />
              </div>
            )}
          </div>
          <div>
            <Label className="text-slate-900">Priority</Label>
            {isEditing ? (
              <select
                value={getFieldValue('priority')}
                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            ) : (
              <div className="mt-1">
                <PriorityBadge priority={task.priority} />
              </div>
            )}
          </div>
          <div>
            <Label className="text-slate-900">Department</Label>
            <div className="mt-1">
              <DepartmentBadge departmentId={task.department} size="md" />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-slate-900">Description</Label>
          {isEditing ? (
            <Textarea
              value={getFieldValue('description')}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={4}
              className="mt-1 bg-white text-slate-900 border-slate-300"
            />
          ) : (
            <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{task.description || 'No description'}</p>
          )}
        </div>

        <div>
          <Label className="text-slate-900">Assignees</Label>
          {isEditing ? (
            <div className="mt-2 space-y-2 border border-slate-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
              {allUsers.map((u) => (
                <label key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={getFieldValue('assignees').includes(u.id)}
                    onChange={() => toggleAssignee(u.id)}
                    className="rounded border-slate-300"
                  />
                  <UserAvatar userId={u.id} size="sm" />
                  <span className="text-sm text-slate-900">{u.full_name}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {task.assignees.length === 0 ? (
                <p className="text-sm text-slate-600">No assignees</p>
              ) : (
                task.assignees.map((userId) => {
                  const assignee = allUsers.find(u => u.id === userId);
                  return assignee ? (
                    <div key={userId} className="flex items-center gap-2">
                      <UserAvatar userId={userId} size="sm" />
                      <span className="text-sm text-slate-900">{assignee.full_name}</span>
                    </div>
                  ) : null;
                })
              )}
            </div>
          )}
        </div>

        <div>
          <Label className="text-slate-900">Due Date</Label>
          {isEditing ? (
            <input
              type="date"
              value={getFieldValue('due_date') ? format(new Date(getFieldValue('due_date')!), 'yyyy-MM-dd') : ''}
              onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value ? new Date(e.target.value) : null })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="mt-1 text-sm text-slate-900">
              {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
            </p>
          )}
        </div>

        <div>
          <Label className="text-slate-900">Tags</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.tags.length === 0 ? (
              <p className="text-sm text-slate-600">No tags</p>
            ) : (
              task.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs text-slate-700 bg-slate-100 rounded">
                  {tag}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div>
            <Label className="text-slate-900">Created by</Label>
            <div className="mt-1 flex items-center gap-2">
              {creator && (
                <>
                  <UserAvatar userId={creator.id} size="sm" />
                  <span className="text-sm text-slate-900">{creator.full_name}</span>
                </>
              )}
            </div>
          </div>
          <div>
            <Label className="text-slate-900">Created on</Label>
            <p className="mt-1 text-sm text-slate-900">{format(new Date(task.creation_date), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <Label className="text-slate-900">Comments ({task.comments.length})</Label>
          <div className="mt-3 space-y-4">
            {task.comments.map((comment) => {
              const author = allUsers.find(u => u.id === comment.author);
              return (
                <div key={comment.comment_id} className="flex gap-3">
                  <UserAvatar userId={comment.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{author?.full_name}</span>
                      <span className="text-xs text-slate-600">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="resize-none bg-white text-slate-900 border-slate-300"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <Button
          variant="outline"
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleDelete}
        >
          Delete Task
        </Button>
      </div>
    </div>
  );
}
