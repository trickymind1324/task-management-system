// ABOUTME: Kanban board view displaying tasks organized by status columns
// ABOUTME: Shows task cards with priority, assignees, due dates, and tags

'use client';

import { useState } from 'react';
import { useTaskStore } from '@/lib/store/task-store';
import { TaskStatus } from '@/types';
import { PriorityBadge } from '../common/PriorityBadge';
import { UserAvatar } from '../common/UserAvatar';
import { RecurringBadge } from '../common/RecurringBadge';
import { FilterSortMenu } from './FilterSortMenu';
import { format } from 'date-fns';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'To Do', label: 'To Do', color: 'bg-slate-100' },
  { status: 'In Progress', label: 'In Progress', color: 'bg-blue-100' },
  { status: 'In Review', label: 'In Review', color: 'bg-purple-100' },
  { status: 'Blocked', label: 'Blocked', color: 'bg-red-100' },
  { status: 'Done', label: 'Done', color: 'bg-emerald-100' },
];

export function TaskBoard() {
  const { filteredTasks, setSelectedTask } = useTaskStore();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Board View</h2>
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

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 sm:p-6 h-full min-w-max">
          {COLUMNS.map((column) => {
            const tasks = getTasksByStatus(column.status);
            return (
              <div
                key={column.status}
                className="flex flex-col w-72 bg-slate-50 rounded-lg flex-shrink-0"
              >
                {/* Column Header */}
                <div className={`px-4 py-3 ${column.color} rounded-t-lg border-b border-slate-200`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-900">{column.label}</h3>
                    <span className="bg-white text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full border border-slate-200">
                      {tasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.task_id}
                      onClick={() => setSelectedTask(task.task_id)}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Priority Badge */}
                      <div className="flex items-start justify-between mb-2">
                        <PriorityBadge priority={task.priority} />
                        {task.due_date && isOverdue(task.due_date) && task.status !== 'Done' && (
                          <span className="text-red-600 text-xs" title="Overdue">⚠️</span>
                        )}
                      </div>

                      {/* Task Title */}
                      <div className="flex items-start gap-2 mb-2">
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-2 flex-1">
                          {task.title}
                        </h4>
                        {task.is_recurring && (
                          <RecurringBadge frequency={task.recurrence_pattern?.frequency} size="sm" />
                        )}
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                          {task.description.split('\n')[0]}
                        </p>
                      )}

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 text-xs text-slate-700 bg-slate-100 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="text-xs text-slate-500">+{task.tags.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Footer - Assignees and Due Date */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        {/* Assignees */}
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map((userId) => (
                            <UserAvatar key={userId} userId={userId} size="sm" />
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-slate-700">+{task.assignees.length - 3}</span>
                            </div>
                          )}
                          {task.assignees.length === 0 && (
                            <span className="text-xs text-slate-500">Unassigned</span>
                          )}
                        </div>

                        {/* Due Date */}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className={`text-xs ${isOverdue(task.due_date) && task.status !== 'Done' ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                              {format(new Date(task.due_date), 'MMM d')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
