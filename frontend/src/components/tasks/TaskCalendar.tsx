// ABOUTME: Monthly calendar view showing tasks organized by due date
// ABOUTME: Displays task cards color-coded by priority with overdue indicators

'use client';

import { useState } from 'react';
import { useTaskStore } from '@/lib/store/task-store';
import { RecurringBadge } from '../common/RecurringBadge';
import { FilterSortMenu } from './FilterSortMenu';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';

export function TaskCalendar() {
  const { filteredTasks, setSelectedTask } = useTaskStore();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter((task) => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  const isOverdue = (dueDate: Date) => {
    return dueDate < new Date() && !isToday(dueDate);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Calendar View</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {format(currentDate, 'MMMM yyyy')}
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

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const tasksForDay = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 sm:min-h-32 p-2 rounded-lg border ${
                  isTodayDate
                    ? 'bg-blue-50 border-blue-300'
                    : isCurrentMonth
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                {/* Date Number */}
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDate
                    ? 'text-blue-600'
                    : isCurrentMonth
                    ? 'text-slate-900'
                    : 'text-slate-500'
                }`}>
                  {format(day, 'd')}
                </div>

                {/* Tasks for this day */}
                <div className="space-y-1">
                  {tasksForDay.slice(0, 3).map((task) => {
                    const taskIsOverdue = isOverdue(new Date(task.due_date!));
                    return (
                      <div
                        key={task.task_id}
                        onClick={() => setSelectedTask(task.task_id)}
                        className={`text-xs p-1.5 rounded cursor-pointer hover:shadow-sm transition-shadow ${
                          task.priority === 'Urgent'
                            ? 'bg-red-100 hover:bg-red-200'
                            : task.priority === 'High'
                            ? 'bg-orange-100 hover:bg-orange-200'
                            : task.priority === 'Medium'
                            ? 'bg-yellow-100 hover:bg-yellow-200'
                            : 'bg-slate-100 hover:bg-slate-200'
                        } ${taskIsOverdue && task.status !== 'Done' ? 'border border-red-400' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          <p className="font-medium truncate text-slate-900 flex-1">
                            {taskIsOverdue && task.status !== 'Done' && '⚠️ '}
                            {task.title}
                          </p>
                          {task.is_recurring && (
                            <RecurringBadge size="sm" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Show "+X more" if there are more tasks */}
                  {tasksForDay.length > 3 && (
                    <div className="text-xs text-slate-600 text-center py-1">
                      +{tasksForDay.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center gap-4 text-xs text-slate-700 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded border border-slate-200"></div>
          <span>Urgent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 rounded border border-slate-200"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 rounded border border-slate-200"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-slate-100 rounded border border-slate-200"></div>
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}
