// Utility functions for permission checking
import api from '../api';

// Define permission types
export type PermissionTask =
  | 'testsuite_management'
  | 'test_management'
  | 'testsuite_execution'
  | 'test_execution'
  | 'administration';

export type PermissionAction = 'read' | 'write' | 'approve' | 'delete';

export interface UserPermission {
  task_name: PermissionTask;
  action: PermissionAction;
}

// Cache for user permissions to avoid repeated API calls
let userPermissionsCache: UserPermission[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current user's permissions from the backend
 * @returns Promise<UserPermission[]> Array of user's permissions
 */
export const fetchUserPermissions = async (): Promise<UserPermission[]> => {
  try {
    // Check if we have cached permissions that are still valid
    const now = Date.now();
    if (userPermissionsCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      return userPermissionsCache;
    }
    
    const response = await api.get('/auth/user/permissions');
    userPermissionsCache = response.data;
    lastFetchTime = now;
    return response.data;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
};

/**
 * Check if a user has a specific permission
 * @param task The task to check
 * @param action The action to check
 * @returns Promise<boolean> Whether the user has the permission
 */
export const hasPermission = async (task: PermissionTask, action: PermissionAction): Promise<boolean> => {
  try {
    const permissions = await fetchUserPermissions();
    return permissions.some(
      (permission) =>
        permission.task_name === task &&
        permission.action === action
    );
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

/**
 * Check if a user has any of the specified permissions
 * @param permissions Array of [task, action] pairs to check
 * @returns Promise<boolean> Whether the user has any of the permissions
 */
export const hasAnyPermission = async (permissions: [PermissionTask, PermissionAction][]): Promise<boolean> => {
  try {
    const userPermissions = await fetchUserPermissions();
    
    // Check each permission until we find one the user has
    for (const [task, action] of permissions) {
      if (userPermissions.some(
        (permission) =>
          permission.task_name === task &&
          permission.action === action
      )) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

/**
 * Check if a user has all of the specified permissions
 * @param permissions Array of [task, action] pairs to check
 * @returns Promise<boolean> Whether the user has all of the permissions
 */
export const hasAllPermissions = async (permissions: [PermissionTask, PermissionAction][]): Promise<boolean> => {
  try {
    const userPermissions = await fetchUserPermissions();
    
    // Check each permission - if any fail, return false
    for (const [task, action] of permissions) {
      if (!userPermissions.some(
        (permission) =>
          permission.task_name === task &&
          permission.action === action
      )) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

/**
 * Clear the permissions cache (useful when user permissions change)
 */
export const clearPermissionsCache = (): void => {
  userPermissionsCache = null;
  lastFetchTime = null;
};

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  fetchUserPermissions,
  clearPermissionsCache
};