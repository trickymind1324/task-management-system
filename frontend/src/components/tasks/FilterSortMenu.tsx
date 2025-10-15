// ABOUTME: Filter and sort menu component for task list filtering and sorting options.
// ABOUTME: Provides checkboxes for status/priority filters and sort order selection.
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '@/lib/store/task-store';
import { TaskStatus, TaskPriority } from '@/types';

interface FilterSortMenuProps {
  showFilterMenu: boolean;
  showSortMenu: boolean;
  onCloseFilter: () => void;
  onCloseSort: () => void;
}

export function FilterSortMenu({
  showFilterMenu,
  showSortMenu,
  onCloseFilter,
  onCloseSort,
}: FilterSortMenuProps) {
  const { filters, setFilters, filteredTasks } = useTaskStore();
  const [sortBy, setSortBy] = useState<string>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        onCloseFilter();
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        onCloseSort();
      }
    };

    if (showFilterMenu || showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFilterMenu, showSortMenu, onCloseFilter, onCloseSort]);

  const handleStatusFilter = (status: TaskStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    setFilters({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handlePriorityFilter = (priority: TaskPriority) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];

    setFilters({ ...filters, priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleSort = (field: string) => {
    setSortBy(field);
  };

  const allStatuses: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done'];
  const allPriorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

  return (
    <>
      {showFilterMenu && (
        <div
          ref={filterRef}
          className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-20"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-2">Status</label>
              <div className="space-y-2">
                {allStatuses.map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status) || false}
                      onChange={() => handleStatusFilter(status)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Priority</label>
              <div className="space-y-2">
                {allPriorities.map((priority) => (
                  <label key={priority} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priority?.includes(priority) || false}
                      onChange={() => handlePriorityFilter(priority)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-lg">
            <p className="text-xs text-slate-600">
              Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
        </div>
      )}

      {showSortMenu && (
        <div
          ref={sortRef}
          className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-20"
        >
          <div className="py-1">
            <button
              onClick={() => {
                handleSort('created');
                onCloseSort();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                sortBy === 'created' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              Sort by Date Created
            </button>
            <button
              onClick={() => {
                handleSort('due_date');
                onCloseSort();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                sortBy === 'due_date' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              Sort by Due Date
            </button>
            <button
              onClick={() => {
                handleSort('priority');
                onCloseSort();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                sortBy === 'priority' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              Sort by Priority
            </button>
            <button
              onClick={() => {
                handleSort('status');
                onCloseSort();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                sortBy === 'status' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              Sort by Status
            </button>
            <button
              onClick={() => {
                handleSort('title');
                onCloseSort();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                sortBy === 'title' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              Sort by Title (A-Z)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
