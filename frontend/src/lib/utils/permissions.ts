// ABOUTME: RBAC permission utility functions for checking user permissions
// ABOUTME: Handles role-based and permission-based access control checks

import { UserRole } from '@/types';

// Permission definitions based on Phase 1 requirements
export const PERMISSIONS = {
  // Task permissions
  TASKS_CREATE: 'tasks.create',
  TASKS_EDIT_OWN: 'tasks.edit.own',
  TASKS_EDIT_TEAM: 'tasks.edit.team',
  TASKS_EDIT_ALL: 'tasks.edit.all',
  TASKS_DELETE_OWN: 'tasks.delete.own',
  TASKS_DELETE_TEAM: 'tasks.delete.team',
  TASKS_DELETE_ALL: 'tasks.delete.all',
  TASKS_VIEW_OWN: 'tasks.view.own',
  TASKS_VIEW_TEAM: 'tasks.view.team',
  TASKS_VIEW_ALL: 'tasks.view.all',
  TASKS_ASSIGN: 'tasks.assign',

  // User permissions
  USERS_MANAGE: 'users.manage',

  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  DATA_EXPORT: 'data.export',
} as const;

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Admin: [
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT_OWN,
    PERMISSIONS.TASKS_EDIT_TEAM,
    PERMISSIONS.TASKS_EDIT_ALL,
    PERMISSIONS.TASKS_DELETE_OWN,
    PERMISSIONS.TASKS_DELETE_TEAM,
    PERMISSIONS.TASKS_DELETE_ALL,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_VIEW_TEAM,
    PERMISSIONS.TASKS_VIEW_ALL,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DATA_EXPORT,
  ],
  Manager: [
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT_OWN,
    PERMISSIONS.TASKS_EDIT_TEAM,
    PERMISSIONS.TASKS_DELETE_OWN,
    PERMISSIONS.TASKS_DELETE_TEAM,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_VIEW_TEAM,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DATA_EXPORT,
  ],
  Member: [
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT_OWN,
    PERMISSIONS.TASKS_DELETE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_VIEW_TEAM,
  ],
  Viewer: [
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_VIEW_TEAM,
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userPermissions: string[] | undefined,
  userRole: UserRole | undefined,
  permission: string
): boolean {
  // Check explicit permissions first
  if (userPermissions?.includes(permission)) {
    return true;
  }

  // Fall back to role-based permissions
  if (userRole && ROLE_PERMISSIONS[userRole]?.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasRole(
  userRole: UserRole | undefined,
  ...roles: UserRole[]
): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: string[] | undefined,
  userRole: UserRole | undefined,
  ...permissions: string[]
): boolean {
  return permissions.every(permission =>
    hasPermission(userPermissions, userRole, permission)
  );
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: string[] | undefined,
  userRole: UserRole | undefined,
  ...permissions: string[]
): boolean {
  return permissions.some(permission =>
    hasPermission(userPermissions, userRole, permission)
  );
}

/**
 * Check if a user can edit a specific task
 */
export function canEditTask(
  userPermissions: string[] | undefined,
  userRole: UserRole | undefined,
  taskCreator: string,
  taskDepartment: string | null,
  userId: string,
  userDepartment: string | null
): boolean {
  // Admin can edit all tasks
  if (hasPermission(userPermissions, userRole, PERMISSIONS.TASKS_EDIT_ALL)) {
    return true;
  }

  // Can edit team tasks if in same department
  if (
    hasPermission(userPermissions, userRole, PERMISSIONS.TASKS_EDIT_TEAM) &&
    taskDepartment === userDepartment
  ) {
    return true;
  }

  // Can edit own tasks
  if (
    hasPermission(userPermissions, userRole, PERMISSIONS.TASKS_EDIT_OWN) &&
    taskCreator === userId
  ) {
    return true;
  }

  return false;
}

/**
 * Check if a user can delete a specific task
 */
export function canDeleteTask(
  userPermissions: string[] | undefined,
  userRole: UserRole | undefined,
  taskCreator: string,
  taskDepartment: string | null,
  userId: string,
  userDepartment: string | null
): boolean {
  // Admin can delete all tasks
  if (hasPermission(userPermissions, userRole, PERMISSIONS.TASKS_DELETE_ALL)) {
    return true;
  }

  // Can delete team tasks if in same department
  if (
    hasPermission(userPermissions, userRole, PERMISSIONS.TASKS_DELETE_TEAM) &&
    taskDepartment === userDepartment
  ) {
    return true;
  }

  // Can delete own tasks
  if (
    hasPermission(userPermissions, userRole, PERMISSIONS.TASKS_DELETE_OWN) &&
    taskCreator === userId
  ) {
    return true;
  }

  return false;
}
