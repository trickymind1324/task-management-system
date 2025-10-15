// ABOUTME: Dashboard header component with search, notifications, and user menu
// ABOUTME: Responsive design with mobile search toggle and user profile display

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useTaskStore } from '@/lib/store/task-store';
import { UserAvatar } from '../common/UserAvatar';

export function Header() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const setFilters = useTaskStore(state => state.setFilters);
  const [searchValue, setSearchValue] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSearch = (query: string) => {
    setSearchValue(query);
    setFilters({ search: query });
  };

  const handleMobileSearchToggle = () => {
    setShowMobileSearch(!showMobileSearch);
    if (showMobileSearch) {
      setSearchValue('');
      setFilters({ search: '' });
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 text-sm bg-slate-50 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            {searchValue && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right Side - User Menu */}
        <div className="flex items-center gap-2">
          {/* Search icon for mobile */}
          <button
            onClick={handleMobileSearchToggle}
            className="md:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* User Info */}
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <UserAvatar userId={user.user_id} size="md" />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3 border-t border-slate-200 pt-3">
          <div className="relative">
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full px-4 py-2 pl-10 pr-4 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchValue && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
