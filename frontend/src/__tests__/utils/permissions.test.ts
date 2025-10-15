// Test suite for RBAC permissions utility functions

import {
  hasPermission,
  hasRole,
  hasAllPermissions,
  hasAnyPermission,
  canEditTask,
  canDeleteTask,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from '@/lib/utils/permissions';
import { UserRole } from '@/types';

describe('Permissions Utility', () => {
  describe('hasPermission', () => {
    it('should return true when user has explicit permission', () => {
      const permissions = [PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_EDIT_OWN];
      const result = hasPermission(permissions, 'Member', PERMISSIONS.TASKS_CREATE);
      expect(result).toBe(true);
    });

    it('should return true when user role includes permission', () => {
      const result = hasPermission(undefined, 'Admin', PERMISSIONS.TASKS_DELETE_ALL);
      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      const result = hasPermission(undefined, 'Viewer', PERMISSIONS.TASKS_CREATE);
      expect(result).toBe(false);
    });

    it('should return false when no permissions and no role', () => {
      const result = hasPermission(undefined, undefined, PERMISSIONS.TASKS_CREATE);
      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      const result = hasRole('Admin', 'Admin', 'Manager');
      expect(result).toBe(true);
    });

    it('should return false when user does not have any specified role', () => {
      const result = hasRole('Member', 'Admin', 'Manager');
      expect(result).toBe(false);
    });

    it('should return false when role is undefined', () => {
      const result = hasRole(undefined, 'Admin');
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all specified permissions', () => {
      const permissions = [PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_EDIT_OWN];
      const result = hasAllPermissions(
        permissions,
        'Member',
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_EDIT_OWN
      );
      expect(result).toBe(true);
    });

    it('should return false when user lacks one permission', () => {
      const permissions = [PERMISSIONS.TASKS_CREATE];
      const result = hasAllPermissions(
        permissions,
        'Member',
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.USERS_MANAGE
      );
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const permissions = [PERMISSIONS.TASKS_CREATE];
      const result = hasAnyPermission(
        permissions,
        'Member',
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.USERS_MANAGE
      );
      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const permissions = [PERMISSIONS.TASKS_VIEW_OWN];
      const result = hasAnyPermission(
        permissions,
        'Member',
        PERMISSIONS.USERS_MANAGE,
        PERMISSIONS.ANALYTICS_VIEW
      );
      expect(result).toBe(false);
    });
  });

  describe('canEditTask', () => {
    const userId = 'user-001';
    const userDept = 'dept-001';

    it('should allow Admin to edit any task', () => {
      const result = canEditTask(
        undefined,
        'Admin',
        'user-002',
        'dept-002',
        userId,
        userDept
      );
      expect(result).toBe(true);
    });

    it('should allow Manager to edit team tasks in same department', () => {
      const result = canEditTask(
        undefined,
        'Manager',
        'user-002',
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(true);
    });

    it('should not allow Manager to edit tasks in different department', () => {
      const result = canEditTask(
        undefined,
        'Manager',
        'user-002',
        'dept-002',
        userId,
        userDept
      );
      expect(result).toBe(false);
    });

    it('should allow Member to edit own tasks', () => {
      const result = canEditTask(
        undefined,
        'Member',
        userId,
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(true);
    });

    it('should not allow Member to edit other tasks', () => {
      const result = canEditTask(
        undefined,
        'Member',
        'user-002',
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(false);
    });

    it('should not allow Viewer to edit any tasks', () => {
      const result = canEditTask(
        undefined,
        'Viewer',
        userId,
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(false);
    });
  });

  describe('canDeleteTask', () => {
    const userId = 'user-001';
    const userDept = 'dept-001';

    it('should allow Admin to delete any task', () => {
      const result = canDeleteTask(
        undefined,
        'Admin',
        'user-002',
        'dept-002',
        userId,
        userDept
      );
      expect(result).toBe(true);
    });

    it('should allow Manager to delete team tasks in same department', () => {
      const result = canDeleteTask(
        undefined,
        'Manager',
        'user-002',
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(true);
    });

    it('should not allow Manager to delete tasks in different department', () => {
      const result = canDeleteTask(
        undefined,
        'Manager',
        'user-002',
        'dept-002',
        userId,
        userDept
      );
      expect(result).toBe(false);
    });

    it('should allow Member to delete own tasks', () => {
      const result = canDeleteTask(
        undefined,
        'Member',
        userId,
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(true);
    });

    it('should not allow Member to delete other tasks', () => {
      const result = canDeleteTask(
        undefined,
        'Member',
        'user-002',
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(false);
    });

    it('should not allow Viewer to delete any tasks', () => {
      const result = canDeleteTask(
        undefined,
        'Viewer',
        userId,
        userDept,
        userId,
        userDept
      );
      expect(result).toBe(false);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for all roles', () => {
      expect(ROLE_PERMISSIONS.Admin).toBeDefined();
      expect(ROLE_PERMISSIONS.Manager).toBeDefined();
      expect(ROLE_PERMISSIONS.Member).toBeDefined();
      expect(ROLE_PERMISSIONS.Viewer).toBeDefined();
    });

    it('should give Admin all permissions', () => {
      expect(ROLE_PERMISSIONS.Admin).toContain(PERMISSIONS.TASKS_DELETE_ALL);
      expect(ROLE_PERMISSIONS.Admin).toContain(PERMISSIONS.USERS_MANAGE);
      expect(ROLE_PERMISSIONS.Admin).toContain(PERMISSIONS.ANALYTICS_VIEW);
    });

    it('should give Manager appropriate permissions', () => {
      expect(ROLE_PERMISSIONS.Manager).toContain(PERMISSIONS.TASKS_EDIT_TEAM);
      expect(ROLE_PERMISSIONS.Manager).toContain(PERMISSIONS.TASKS_ASSIGN);
      expect(ROLE_PERMISSIONS.Manager).not.toContain(PERMISSIONS.TASKS_EDIT_ALL);
    });

    it('should give Member limited permissions', () => {
      expect(ROLE_PERMISSIONS.Member).toContain(PERMISSIONS.TASKS_CREATE);
      expect(ROLE_PERMISSIONS.Member).toContain(PERMISSIONS.TASKS_EDIT_OWN);
      expect(ROLE_PERMISSIONS.Member).not.toContain(PERMISSIONS.TASKS_EDIT_TEAM);
    });

    it('should give Viewer only view permissions', () => {
      expect(ROLE_PERMISSIONS.Viewer).toContain(PERMISSIONS.TASKS_VIEW_OWN);
      expect(ROLE_PERMISSIONS.Viewer).toContain(PERMISSIONS.TASKS_VIEW_TEAM);
      expect(ROLE_PERMISSIONS.Viewer).not.toContain(PERMISSIONS.TASKS_CREATE);
    });
  });
});
