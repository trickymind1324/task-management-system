// ABOUTME: React hook for checking user permissions in components
// ABOUTME: Provides convenient permission checking functions using current user context

import { useAuthStore } from '../store/auth-store';
import {
  hasPermission as checkPermission,
  hasRole as checkRole,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  canEditTask as checkCanEditTask,
  canDeleteTask as checkCanDeleteTask,
} from '../utils/permissions';
import { UserRole } from '@/types';

export function usePermissions() {
  const user = useAuthStore(state => state.user);

  const hasPermission = (permission: string): boolean => {
    return checkPermission(user?.permissions, user?.role, permission);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    return checkRole(user?.role, ...roles);
  };

  const hasAllPermissions = (...permissions: string[]): boolean => {
    return checkAllPermissions(user?.permissions, user?.role, ...permissions);
  };

  const hasAnyPermission = (...permissions: string[]): boolean => {
    return checkAnyPermission(user?.permissions, user?.role, ...permissions);
  };

  const canEditTask = (
    taskCreator: string,
    taskDepartment: string | null
  ): boolean => {
    if (!user) return false;
    return checkCanEditTask(
      user.permissions,
      user.role,
      taskCreator,
      taskDepartment,
      user.id,
      user.department
    );
  };

  const canDeleteTask = (
    taskCreator: string,
    taskDepartment: string | null
  ): boolean => {
    if (!user) return false;
    return checkCanDeleteTask(
      user.permissions,
      user.role,
      taskCreator,
      taskDepartment,
      user.id,
      user.department
    );
  };

  return {
    hasPermission,
    hasRole,
    hasAllPermissions,
    hasAnyPermission,
    canEditTask,
    canDeleteTask,
  };
}
