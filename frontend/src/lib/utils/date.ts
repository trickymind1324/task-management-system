// ABOUTME: Date formatting utilities for consistent date display across the app
// ABOUTME: Wraps date-fns functions with application-specific formatting rules

import { format, formatDistance, isToday, isTomorrow, isPast, isBefore } from 'date-fns';

export function formatDate(date: Date | null): string {
  if (!date) return 'No date';
  return format(date, 'MMM d, yyyy');
}

export function formatDateTime(date: Date | null): string {
  if (!date) return 'No date';
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatRelativeDate(date: Date | null): string {
  if (!date) return 'No date';

  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';

  return formatDistance(date, new Date(), { addSuffix: true });
}

export function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return isBefore(dueDate, new Date()) && !isToday(dueDate);
}

export function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}
