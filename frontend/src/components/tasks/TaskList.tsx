// ABOUTME: Task list table component with filtering, sorting, bulk actions, and row selection.
// ABOUTME: Displays tasks in a tabular format with priority, status, assignees, and due dates.
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/store/task-store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { TaskStatus } from '@/types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { UserAvatar } from '../common/UserAvatar';
import { DepartmentBadge } from '../common/DepartmentBadge';
import { RecurringBadge } from '../common/RecurringBadge';
import { Button } from '../ui/button';
import { FilterSortMenu } from './FilterSortMenu';
import { format } from 'date-fns';

export function TaskList() {
  const { filteredTasks, isLoading, setSelectedTask, updateTask, deleteTask } = useTaskStore();
  const { addNotification } = useNotificationStore();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const bulkActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bulkActionsRef.current && !bulkActionsRef.current.contains(event.target as Node)) {
        setShowBulkActionsMenu(false);
      }
    };

    if (showBulkActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBulkActionsMenu]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-700">Loading tasks...</p>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
        <p className="text-slate-600 mb-6">Try adjusting your filters or create a new task</p>
      </div>
    );
  }

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && true;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(filteredTasks.map(t => t.task_id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    } else {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId));
    }
  };

  const handleBulkStatusChange = async (status: TaskStatus) => {
    for (const taskId of selectedTaskIds) {
      await updateTask(taskId, { status });
    }
    addNotification({
      type: 'success',
      title: 'Tasks updated',
      message: `${selectedTaskIds.length} task(s) marked as ${status}`,
      duration: 3000,
    });
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedTaskIds.length} task(s)?`)) {
      for (const taskId of selectedTaskIds) {
        await deleteTask(taskId);
      }
      addNotification({
        type: 'success',
        title: 'Tasks deleted',
        message: `${selectedTaskIds.length} task(s) deleted successfully`,
        duration: 3000,
      });
      setSelectedTaskIds([]);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
        {selectedTaskIds.length > 0 ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-900">
                {selectedTaskIds.length} selected
              </span>
              <div className="relative" ref={bulkActionsRef}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
                  className="text-xs text-slate-900 flex items-center gap-1"
                >
                  Actions
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                {showBulkActionsMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleBulkStatusChange('To Do');
                          setShowBulkActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Mark as To Do
                      </button>
                      <button
                        onClick={() => {
                          handleBulkStatusChange('In Progress');
                          setShowBulkActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Mark as In Progress
                      </button>
                      <button
                        onClick={() => {
                          handleBulkStatusChange('In Review');
                          setShowBulkActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Mark as In Review
                      </button>
                      <button
                        onClick={() => {
                          handleBulkStatusChange('Done');
                          setShowBulkActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Mark as Done
                      </button>
                      <div className="border-t border-slate-200 my-1"></div>
                      <button
                        onClick={() => {
                          handleBulkDelete();
                          setShowBulkActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete Tasks
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedTaskIds([])}
              className="text-xs text-slate-700 hover:text-slate-900"
            >
              Clear Selection
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Tasks</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 relative">
              <button
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowSortMenu(false);
                }}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  showFilterMenu ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Filter
              </button>
              <button
                onClick={() => {
                  setShowSortMenu(!showSortMenu);
                  setShowFilterMenu(false);
                }}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                  showSortMenu ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Sort
              </button>
              <FilterSortMenu
                showFilterMenu={showFilterMenu}
                showSortMenu={showSortMenu}
                onCloseFilter={() => setShowFilterMenu(false)}
                onCloseSort={() => setShowSortMenu(false)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[800px]">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-input"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[300px]">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-36">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-36">
                Assignees
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTasks.map((task) => (
              <tr
                key={task.task_id}
                onClick={() => setSelectedTask(task.task_id)}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(task.task_id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectTask(task.task_id, e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-3 py-3">
                  <div className="min-w-[250px]">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">
                        {task.title}
                      </p>
                      {task.is_recurring && (
                        <RecurringBadge frequency={task.recurrence_pattern?.frequency} size="sm" />
                      )}
                      <DepartmentBadge departmentId={task.department} size="sm" />
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 2).map((userId) => (
                      <UserAvatar key={userId} userId={userId} size="sm" />
                    ))}
                    {task.assignees.length > 2 && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-slate-700">+{task.assignees.length - 2}</span>
                      </div>
                    )}
                    {task.assignees.length === 0 && (
                      <span className="text-xs text-slate-500">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {task.due_date ? (
                    <div className="flex items-center gap-1">
                      {isOverdue(task.due_date) && task.status !== 'Done' && (
                        <span className="text-red-600" title="Overdue">⚠️</span>
                      )}
                      <span className={isOverdue(task.due_date) && task.status !== 'Done' ? 'text-red-600 text-sm' : 'text-sm text-slate-700'}>
                        {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">No due date</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {task.project ? (
                    <span className="text-sm text-slate-700">
                      {task.project === 'proj-001' ? 'Website Redesign' : 'Q4 Budget'}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex items-center justify-between">
        <p className="text-xs sm:text-sm text-slate-600">
          {filteredTasks.length} total tasks
        </p>
        <div className="flex gap-1 sm:gap-2">
          <button className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
