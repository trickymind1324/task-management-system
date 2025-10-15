// ABOUTME: Utility function for merging class names with Tailwind CSS
// ABOUTME: Combines clsx for conditional classes and tailwind-merge for conflict resolution

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
