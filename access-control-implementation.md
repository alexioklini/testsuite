# Access Control Implementation Details

## Overview
This document provides detailed implementation guidelines for the access control system, including both client-side and server-side components.

## Server-Side Implementation

### Permission Checking Middleware
Create middleware to verify user permissions for protected routes:

```javascript
const checkPermission = (requiredTask, requiredAction) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Check if user has the required permission
      const hasPermission = await database.checkUserPermission(userId, requiredTask, requiredAction);
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};
```

### Database Queries for Permission Checking

#### Check Direct User Permissions
```sql
SELECT COUNT(*) as count FROM user_permissions up
JOIN permissions p ON up.permission_id = p.id
WHERE up.user_id = ? AND p.task_name = ? AND p.action = ?
```

#### Check Role-Based Permissions
```sql
SELECT COUNT(*) as count FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = ? AND p.task_name = ? AND p.action = ?
```

#### Get All User Permissions (Combined)
```sql
SELECT DISTINCT p.task_name, p.action FROM (
  -- Direct permissions
  SELECT p.task_name, p.action
  FROM user_permissions up
  JOIN permissions p ON up.permission_id = p.id
  WHERE up.user_id = ?
  
  UNION
  
  -- Role-based permissions
  SELECT p.task_name, p.action
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = ?
) AS user_permissions
```

### User Service Methods

#### GetUserPermissions
```javascript
async getUserPermissions(userId) {
  const query = `
    SELECT DISTINCT p.task_name, p.action FROM (
      -- Direct permissions
      SELECT p.task_name, p.action
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ?
      
      UNION
      
      -- Role-based permissions
      SELECT p.task_name, p.action
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
    ) AS user_permissions
  `;
  
  const permissions = await database.query(query, [userId, userId]);
  return permissions;
}
```

#### CheckUserPermission
```javascript
async checkUserPermission(userId, taskName, action) {
  const query = `
    SELECT COUNT(*) as count FROM (
      -- Check direct permissions
      SELECT 1
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ? AND p.task_name = ? AND p.action = ?
      
      UNION
      
      -- Check role-based permissions
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ? AND p.task_name = ? AND p.action = ?
    ) AS permission_check
  `;
  
  const result = await database.query(query, [
    userId, taskName, action,
    userId, taskName, action
  ]);
  
  return result[0].count > 0;
}
```

## Client-Side Implementation

### Permission Context
Create a React context to manage user permissions:

```jsx
// PermissionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children, user }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get('/auth/permissions');
        setPermissions(response.data.permissions);
      } catch (err) {
        setError(err.message);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (taskName, action) => {
    if (!permissions.length) return false;
    
    return permissions.some(
      perm => perm.task_name === taskName && perm.action === action
    );
  };

  const value = {
    permissions,
    loading,
    error,
    hasPermission
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
```

### Permission Guard Components

#### PermissionGuard (Render-based)
```jsx
// PermissionGuard.js
import React from 'react';
import { usePermissions } from '../contexts/PermissionContext';

const PermissionGuard = ({ task, action, children, fallback = null }) => {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(task, action)) {
    return children;
  }
  
  return fallback;
};

export default PermissionGuard;
```

#### WithPermission (HOC)
```jsx
// withPermission.js
import React from 'react';
import { usePermissions } from '../contexts/PermissionContext';

const withPermission = (task, action) => (WrappedComponent) => {
  const WithPermissionComponent = (props) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(task, action)) {
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
  
  WithPermissionComponent.displayName = `WithPermission(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPermissionComponent;
};

export default withPermission;
```

### Custom Hooks

#### usePermission
```jsx
// usePermission.js
import { usePermissions } from '../contexts/PermissionContext';

const usePermission = (task, action) => {
  const { hasPermission } = usePermissions();
  return hasPermission(task, action);
};

export default usePermission;
```

## Integration Examples

### Protecting Routes
```jsx
// App.js
import PermissionGuard from './components/PermissionGuard';

function App() {
  return (
    <Routes>
      <Route path="/test-suites" element={
        <PermissionGuard task="testsuite_management" action="read" fallback={<Unauthorized />}>
          <TestSuiteList />
        </PermissionGuard>
      } />
      
      <Route path="/test-suites/new" element={
        <PermissionGuard task="testsuite_management" action="write" fallback={<Unauthorized />}>
          <CreateTestSuite />
        </PermissionGuard>
      } />
    </Routes>
  );
}
```

### Conditional UI Elements
```jsx
// TestSuiteList.js
import usePermission from '../hooks/usePermission';

function TestSuiteList() {
  const canCreate = usePermission('testsuite_management', 'write');
  const canDelete = usePermission('testsuite_management', 'delete');
  
  return (
    <div>
      {canCreate && (
        <Button component={Link} to="/test-suites/new">
          Create Test Suite
        </Button>
      )}
      
      <TestSuiteTable canDelete={canDelete} />
    </div>
  );
}
```

### Protected API Calls
```jsx
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Add a response interceptor to handle 403 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Redirect to unauthorized page or show error message
      window.location.href = '/unauthorized';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Predefined Roles Implementation

### Seeding Initial Data
Create a script to seed the database with predefined roles and permissions:

```javascript
// seed-roles-permissions.js
const predefinedPermissions = [
  // Test Suite Management
  { task_name: 'testsuite_management', action: 'read', description: 'View test suites' },
  { task_name: 'testsuite_management', action: 'write', description: 'Create/update test suites' },
  { task_name: 'testsuite_management', action: 'approve', description: 'Approve test suites' },
  { task_name: 'testsuite_management', action: 'delete', description: 'Delete test suites' },
  
  // Test Management
  { task_name: 'test_management', action: 'read', description: 'View tests' },
  { task_name: 'test_management', action: 'write', description: 'Create/update tests' },
  { task_name: 'test_management', action: 'approve', description: 'Approve tests' },
  { task_name: 'test_management', action: 'delete', description: 'Delete tests' },
  
  // Test Suite Execution
  { task_name: 'testsuite_execution', action: 'read', description: 'View test suite executions' },
  { task_name: 'testsuite_execution', action: 'write', description: 'Start test suite executions' },
  { task_name: 'testsuite_execution', action: 'approve', description: 'Approve test suite executions' },
  { task_name: 'testsuite_execution', action: 'delete', description: 'Delete test suite executions' },
  
  // Test Execution
  { task_name: 'test_execution', action: 'read', description: 'View test executions' },
  { task_name: 'test_execution', action: 'write', description: 'Execute tests' },
  { task_name: 'test_execution', action: 'approve', description: 'Approve test executions' },
  { task_name: 'test_execution', action: 'delete', description: 'Delete test executions' },
  
  // Administration
  { task_name: 'administration', action: 'read', description: 'View administration panel' },
  { task_name: 'administration', action: 'write', description: 'Modify administration settings' },
  { task_name: 'administration', action: 'approve', description: 'Approve administrative changes' },
  { task_name: 'administration', action: 'delete', description: 'Delete administrative data' }
];

const predefinedRoles = [
  {
    name: 'Administrator',
    description: 'Full system access',
    permissions: predefinedPermissions.map((_, index) => index + 1) // All permissions
  },
  {
    name: 'Test Manager',
    description: 'Manages test suites and tests',
    permissions: [
      1, 2, 4,  // Test Suite Management (read, write, delete)
      5, 6, 8,  // Test Management (read, write, delete)
      9, 10,    // Test Suite Execution (read, write)
      13, 14    // Test Execution (read, write)
    ]
  },
  {
    name: 'Tester',
    description: 'Executes tests',
    permissions: [
      1,        // Test Suite Management (read)
      5,        // Test Management (read)
      9, 10,    // Test Suite Execution (read, write)
      13, 14    // Test Execution (read, write)
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [1, 5, 9, 13] // Read access to all main areas
  }
];

async function seedDatabase() {
  // Insert permissions
  for (const perm of predefinedPermissions) {
    await database.insertPermission(perm);
  }
  
  // Insert roles and assign permissions
  for (const role of predefinedRoles) {
    const roleId = await database.insertRole({
      name: role.name,
      description: role.description
    });
    
    // Assign permissions to role
    for (const permId of role.permissions) {
      await database.assignPermissionToRole(roleId, permId);
    }
  }
}
```

## Security Considerations

### Server-Side Validation
Always validate permissions on the server-side, never rely solely on client-side checks:

```javascript
// Example: Protected endpoint
app.put('/api/test-suites/:id', checkPermission('testsuite_management', 'write'), async (req, res) => {
  // Update test suite logic here
});
```

### Preventing Privilege Escalation
Ensure users cannot assign themselves higher privileges:

```javascript
// When assigning roles/permissions, verify the requesting user has appropriate permissions
const canAssignRole = await checkUserPermission(requestingUserId, 'administration', 'write');
if (!canAssignRole) {
  return res.status(403).json({ error: 'Insufficient permissions to assign roles' });
}
```

### Audit Logging
Log all administrative actions for security auditing:

```javascript
// Log administrative actions
app.post('/api/admin/users/:id/deactivate', async (req, res) => {
  // Perform deactivation
  await deactivateUser(req.params.id);
  
  // Log the action
  await logAuditAction({
    userId: req.user.id,
    action: 'user_deactivate',
    targetUserId: req.params.id,
    timestamp: new Date()
  });
  
  res.json({ success: true });
});
```

## Performance Optimization

### Caching Permissions
Cache user permissions to reduce database queries:

```javascript
// Simple in-memory cache (consider Redis for production)
const permissionCache = new Map();

const getCachedUserPermissions = async (userId) => {
  const cacheKey = `user_permissions_${userId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
    return cached.permissions;
  }
  
  const permissions = await database.getUserPermissions(userId);
  permissionCache.set(cacheKey, {
    permissions,
    timestamp: Date.now()
  });
  
  return permissions;
};
```

### Database Indexes
Create appropriate indexes for permission-related queries:

```sql
-- Indexes for permission checking
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_task_action ON permissions(task_name, action);
```
