import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import usePermissions from '../hooks/usePermissions';
import type { PermissionTask, PermissionAction } from '../utils/permissions';

interface SinglePermission {
  task: PermissionTask;
  action: PermissionAction;
}

interface PermissionGuardProps {
  /**
   * A single permission or array of permissions required to view the content
   */
  permissions: SinglePermission | SinglePermission[];
  
  /**
   * The content to render if the user has the required permission(s)
   */
  children: ReactNode;
  
  /**
   * Optional fallback content to render if the user doesn't have the required permission(s)
   */
  fallback?: ReactNode;
  
  /**
   * Whether to require all permissions (AND) or any permissions (OR)
   * If true, user must have all specified permissions
   * If false, user must have at least one of the specified permissions
   */
  requireAll?: boolean;
}

/**
 * Component that conditionally renders content based on user permissions
 */
const PermissionGuard = ({ 
  permissions, 
  children, 
  fallback = null,
  requireAll = true
}: PermissionGuardProps) => {
  const { hasAnyPermission, hasAllPermissions, loading } = usePermissions();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      // Normalize to array
      const permsArray = Array.isArray(permissions) ? permissions : [permissions];
      
      // Convert to tuple array for permission checking functions
      const permTuples = permsArray.map(p => [p.task, p.action] as [PermissionTask, PermissionAction]);
      
      if (requireAll) {
        const hasAll = hasAllPermissions(permTuples);
        setHasAccess(hasAll);
      } else {
        const hasAny = hasAnyPermission(permTuples);
        setHasAccess(hasAny);
      }
    };
    
    checkPermissions();
  }, [permissions, requireAll, hasAnyPermission, hasAllPermissions]);

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // Render children if user has access, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;