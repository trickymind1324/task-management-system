// ABOUTME: Badge component to indicate recurring tasks
// ABOUTME: Displays a recurring icon badge with optional frequency text

interface RecurringBadgeProps {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  showText?: boolean;
  size?: 'sm' | 'md';
}

export function RecurringBadge({ frequency, showText = false, size = 'md' }: RecurringBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses} bg-purple-100 text-purple-700 rounded-full font-medium`}>
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {showText && frequency && (
        <span className="capitalize">{frequency}</span>
      )}
    </span>
  );
}
