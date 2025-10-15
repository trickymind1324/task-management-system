// ABOUTME: Priority badge component displaying task priority with color-coded styling
// ABOUTME: Shows priority level (Urgent/High/Medium/Low) with colored dot and background

import { TaskPriority } from '@/types';
import { cn } from '@/lib/utils/cn';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const styles = {
    'Urgent': 'bg-red-500/10 text-red-700 border-0',
    'High': 'bg-orange-500/10 text-orange-700 border-0',
    'Medium': 'bg-yellow-500/10 text-yellow-700 border-0',
    'Low': 'bg-green-500/10 text-green-700 border-0',
  };

  const dots = {
    'Urgent': <span className="w-2 h-2 rounded-full bg-red-500" />,
    'High': <span className="w-2 h-2 rounded-full bg-orange-500" />,
    'Medium': <span className="w-2 h-2 rounded-full bg-yellow-500" />,
    'Low': <span className="w-2 h-2 rounded-full bg-green-500" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
        styles[priority],
        className
      )}
    >
      {dots[priority]}
      <span>{priority}</span>
    </span>
  );
}
