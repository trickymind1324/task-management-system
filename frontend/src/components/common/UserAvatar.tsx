// ABOUTME: User avatar component displaying user initials with colored background
// ABOUTME: Supports multiple sizes (sm/md/lg) and optional name display with user data loading

'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types';
import { mockDataStore } from '@/lib/data/mock-store';
import { cn } from '@/lib/utils/cn';

interface UserAvatarProps {
  userId: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const colors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
];

export function UserAvatar({ userId, size = 'md', showName = false, className }: UserAvatarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    mockDataStore.getUserById(userId)
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (!userId || (!user && !isLoading)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn('rounded-full bg-gray-300 animate-pulse', sizeClasses[size], className)} />
    );
  }

  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = userId.charCodeAt(userId.length - 1) % colors.length;
  const bgColor = colors[colorIndex];

  if (showName) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center text-white font-medium',
            sizeClasses[size],
            bgColor
          )}
        >
          {initials}
        </div>
        <span className="text-sm text-gray-700">{user.full_name}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium',
        sizeClasses[size],
        bgColor,
        className
      )}
      title={user.full_name}
    >
      {initials}
    </div>
  );
}
