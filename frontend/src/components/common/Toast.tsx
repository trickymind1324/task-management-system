// ABOUTME: Toast notification system with auto-dismiss and animation support
// ABOUTME: Displays success/error/warning/info messages with styled icons and colors

'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore, Notification, NotificationType } from '@/lib/store/notification-store';

const iconMap: Record<NotificationType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colorMap: Record<NotificationType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    icon: 'bg-emerald-500 text-white',
    text: 'text-emerald-900',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: 'bg-red-500 text-white',
    text: 'text-red-900',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    icon: 'bg-yellow-500 text-white',
    text: 'text-yellow-900',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icon: 'bg-blue-500 text-white',
    text: 'text-blue-900',
  },
};

function ToastItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotificationStore();
  const [isExiting, setIsExiting] = useState(false);
  const colors = colorMap[notification.type];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  useEffect(() => {
    // Auto-close animation before removal
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, notification.duration - 300);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  return (
    <div
      className={`
        flex items-start gap-3 w-full max-w-sm p-4 rounded-lg shadow-lg border-l-4
        ${colors.bg} ${colors.border}
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${colors.icon}`}>
        {iconMap[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${colors.text}`}>{notification.title}</p>
        {notification.message && (
          <p className={`text-xs mt-1 ${colors.text} opacity-90`}>{notification.message}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ${colors.text} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        {notifications.map((notification) => (
          <ToastItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
