// ABOUTME: Department badge component displaying department name with color-coded styling
// ABOUTME: Loads department data and shows color-coded badge (Marketing=Red, Engineering=Blue, Finance=Green)

import { useEffect, useState } from 'react';
import { mockDataStore } from '@/lib/data/mock-store';
import type { Department } from '@/types';

interface DepartmentBadgeProps {
  departmentId: string | null;
  size?: 'sm' | 'md';
}

const departmentColors: Record<string, string> = {
  'dept-001': 'bg-red-100 text-red-700',     // Marketing
  'dept-002': 'bg-blue-100 text-blue-700',   // Engineering
  'dept-003': 'bg-green-100 text-green-700', // Finance
};

export function DepartmentBadge({ departmentId, size = 'sm' }: DepartmentBadgeProps) {
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    const loadDepartment = async () => {
      if (!departmentId) return;
      const departments = await mockDataStore.getDepartments();
      const dept = departments.find(d => d.department_id === departmentId);
      setDepartment(dept || null);
    };
    loadDepartment();
  }, [departmentId]);

  if (!department) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const colorClass = departmentColors[departmentId || ''] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${colorClass}`}>
      {department.name}
    </span>
  );
}
