// ABOUTME: Status badge component displaying task status with color-coded styling
// ABOUTME: Shows status (To Do/In Progress/In Review/Blocked/Done) with themed background

import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils/cn';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    'To Do': 'bg-slate-500/10 text-slate-700',
    'In Progress': 'bg-blue-500/10 text-blue-700',
    'In Review': 'bg-purple-500/10 text-purple-700',
    'Blocked': 'bg-red-500/10 text-red-700',
    'Done': 'bg-emerald-500/10 text-emerald-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
        styles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
