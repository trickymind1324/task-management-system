// ABOUTME: Dashboard sidebar navigation with view modes, filters, and quick actions
// ABOUTME: Fixed sidebar with view switching (List/Board/Calendar) and task filters

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/lib/store/task-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useViewStore } from '@/lib/store/view-store';
import { cn } from '@/lib/utils/cn';

export function Sidebar() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const setFilters = useTaskStore(state => state.setFilters);
  const { viewMode, setViewMode, setShowCreateTaskModal } = useViewStore();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const views = [
    {
      id: 'list' as const,
      name: 'List View',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    },
    {
      id: 'board' as const,
      name: 'Board View',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      )
    },
    {
      id: 'calendar' as const,
      name: 'Calendar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  const handleQuickFilter = (filterId: string, filterFn: () => void) => {
    setActiveFilter(filterId);
    filterFn();
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const quickFilters = [
    {
      id: 'my-tasks',
      name: 'My Tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      filter: () => {
        clearAllFilters();
        if (user) setFilters({ assignees: [user.user_id] });
      }
    },
    {
      id: 'all-tasks',
      name: 'All Tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      filter: () => {
        clearAllFilters();
      }
    },
    {
      id: 'urgent',
      name: 'Urgent',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      filter: () => {
        clearAllFilters();
        setFilters({ priority: ['Urgent', 'High'] });
      }
    },
    {
      id: 'in-progress',
      name: 'In Progress',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      filter: () => {
        clearAllFilters();
        setFilters({ status: ['In Progress'] });
      }
    },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-50 border-r border-slate-200 flex flex-col z-10">
      {/* Logo */}
      <div className="p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Synapse Logo" className="h-8 w-auto" />
        </div>
      </div>

      {/* Views Section */}
      <div className="px-3 pb-4">
        <h2 className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Views
        </h2>
        <nav className="space-y-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                viewMode === view.id
                  ? 'bg-blue-500/10 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              {view.icon}
              <span>{view.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-200" />

      {/* Quick Filters */}
      <div className="px-3 py-4">
        <h2 className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Filters
        </h2>
        <nav className="space-y-1">
          {quickFilters.map((item) => (
            <button
              key={item.id}
              onClick={() => handleQuickFilter(item.id, item.filter)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                activeFilter === item.id
                  ? 'bg-blue-500/10 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-200" />

      {/* Projects Section */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <h2 className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Projects
        </h2>
        <nav className="space-y-1">
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
            <span className="flex-1 text-left truncate">Website Redesign</span>
            <span className="text-xs text-slate-500">12</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
            <span className="flex-1 text-left truncate">Q4 Budget</span>
            <span className="text-xs text-slate-500">3</span>
          </button>
        </nav>
      </div>

      {/* Settings Link */}
      <div className="px-3 pb-3">
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </button>
      </div>

      {/* New Task Button */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={() => setShowCreateTaskModal(true)}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Task</span>
        </button>
      </div>
    </aside>
  );
}
