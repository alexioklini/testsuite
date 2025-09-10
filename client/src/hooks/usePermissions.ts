import { useState, useEffect } from 'react';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  fetchUserPermissions,
  clearPermissionsCache
} from '../utils/permissions';
import type { PermissionTask, PermissionAction, UserPermission } from '../utils/permissions';

/**
 * Custom hook for checking user permissions
 * @returns Object with permission checking functions and user permissions data
 */
const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        const userPermissions = await fetchUserPermissions();
        setPermissions(userPermissions);
      } catch (err) {
        console.error('Error loading permissions:', err);
        setError('Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  /**
   * Check if the user has a specific permission
   */
  const checkPermission = async (task: PermissionTask, action: PermissionAction): Promise<boolean> => {
    return hasPermission(task, action);
  };

  /**
   * Check if the user has any of the specified permissions
   */
  const checkAnyPermission = async (permissions: [PermissionTask, PermissionAction][]): Promise<boolean> => {
    return hasAnyPermission(permissions);
  };

  /**
   * Check if the user has all of the specified permissions
   */
  const checkAllPermissions = async (permissions: [PermissionTask, PermissionAction][]): Promise<boolean> => {
    return hasAllPermissions(permissions);
  };

  /**
   * Refresh the user's permissions
   */
  const refreshPermissions = async () => {
    try {
      setLoading(true);
      clearPermissionsCache();
      const userPermissions = await fetchUserPermissions();
      setPermissions(userPermissions);
      setError(null);
    } catch (err) {
      console.error('Error refreshing permissions:', err);
      setError('Failed to refresh permissions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if the user has a specific permission (synchronous, based on loaded permissions)
   */
  const hasPermissionSync = (task: PermissionTask, action: PermissionAction): boolean => {
    if (loading) return false; // Don't allow access while loading
    return permissions.some(
      (permission) => 
        permission.task_name === task && 
        permission.action === action
    );
  };

  /**
   * Check if the user has any of the specified permissions (synchronous)
   */
  const hasAnyPermissionSync = (permissionsToCheck: [PermissionTask, PermissionAction][]): boolean => {
    if (loading) return false; // Don't allow access while loading
    return permissionsToCheck.some(([task, action]) =>
      permissions.some(
        (permission) => 
          permission.task_name === task && 
          permission.action === action
      )
    );
  };

  /**
   * Check if the user has all of the specified permissions (synchronous)
   */
  const hasAllPermissionsSync = (permissionsToCheck: [PermissionTask, PermissionAction][]): boolean => {
    if (loading) return false; // Don't allow access while loading
    return permissionsToCheck.every(([task, action]) =>
      permissions.some(
        (permission) => 
          permission.task_name === task && 
          permission.action === action
      )
    );
  };

  return {
    // Permission data
    permissions,
    loading,
    error,
    
    // Async permission checking functions
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    
    // Sync permission checking functions (based on loaded data)
    hasPermission: hasPermissionSync,
    hasAnyPermission: hasAnyPermissionSync,
    hasAllPermissions: hasAllPermissionsSync,
    
    // Utility functions
    refreshPermissions
  };
};

export default usePermissions;