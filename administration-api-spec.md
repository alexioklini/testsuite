# Administration Panel API Specification

## Overview
This document specifies the API endpoints required for the administration panel and access control system.

## Authentication and Authorization
All endpoints in this specification require authentication. Additionally, all endpoints require the requesting user to have administrative privileges.

## User Management Endpoints

### List Users
```
GET /api/admin/users
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "is_active": true,
      "is_2fa_enabled": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Get User Details
```
GET /api/admin/users/:id
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "is_active": true,
  "is_2fa_enabled": true,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "roles": [
    {
      "id": 1,
      "name": "Administrator",
      "description": "Full system access"
    }
  ],
  "permissions": [
    {
      "id": 1,
      "task_name": "administration",
      "action": "read",
      "description": "Read administration data"
    }
  ]
}
```

### Deactivate User Account
```
PUT /api/admin/users/:id/deactivate
```

**Request:**
```json
{
  "is_active": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "User account deactivated successfully"
}
```

### Reset User Password
```
POST /api/admin/users/:id/reset-password
```

**Request:**
```json
{
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User password reset successfully"
}
```

### Reset User Two-Factor Authentication
```
DELETE /api/admin/users/:id/2fa
```

**Response:**
```json
{
  "success": true,
  "message": "User two-factor authentication reset successfully"
}
```

## Role Management Endpoints

### List Roles
```
GET /api/admin/roles
```

**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "Administrator",
      "description": "Full system access"
    }
  ]
}
```

### Create Role
```
POST /api/admin/roles
```

**Request:**
```json
{
  "name": "Test Manager",
  "description": "Manages test suites and tests"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Test Manager",
  "description": "Manages test suites and tests"
}
```

### Update Role
```
PUT /api/admin/roles/:id
```

**Request:**
```json
{
  "name": "Test Manager",
  "description": "Manages test suites, tests, and executions"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Test Manager",
  "description": "Manages test suites, tests, and executions"
}
```

### Delete Role
```
DELETE /api/admin/roles/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### Get Role Permissions
```
GET /api/admin/roles/:id/permissions
```

**Response:**
```json
{
  "permissions": [
    {
      "id": 1,
      "task_name": "testsuite_management",
      "action": "read",
      "description": "Read test suite data"
    }
  ]
}
```

### Assign Permissions to Role
```
POST /api/admin/roles/:id/permissions
```

**Request:**
```json
{
  "permission_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions assigned to role successfully"
}
```

## Permission Management Endpoints

### List Permissions
```
GET /api/admin/permissions
```

**Response:**
```json
{
  "permissions": [
    {
      "id": 1,
      "task_name": "testsuite_management",
      "action": "read",
      "description": "Read test suite data"
    }
  ]
}
```

### Get Permission Details
```
GET /api/admin/permissions/:id
```

**Response:**
```json
{
  "id": 1,
  "task_name": "testsuite_management",
  "action": "read",
  "description": "Read test suite data",
  "roles": [
    {
      "id": 1,
      "name": "Administrator",
      "description": "Full system access"
    }
  ]
}
```

## User Assignment Endpoints

### Get User Roles
```
GET /api/admin/users/:id/roles
```

**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "Administrator",
      "description": "Full system access"
    }
  ]
}
```

### Assign Role to User
```
POST /api/admin/users/:id/roles
```

**Request:**
```json
{
  "role_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role assigned to user successfully"
}
```

### Remove Role from User
```
DELETE /api/admin/users/:id/roles/:role_id
```

**Response:**
```json
{
  "success": true,
  "message": "Role removed from user successfully"
}
```

### Get User Direct Permissions
```
GET /api/admin/users/:id/permissions
```

**Response:**
```json
{
  "permissions": [
    {
      "id": 1,
      "task_name": "administration",
      "action": "read",
      "description": "Read administration data"
    }
  ]
}
```

### Assign Direct Permission to User
```
POST /api/admin/users/:id/permissions
```

**Request:**
```json
{
  "permission_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission assigned to user successfully"
}
```

### Remove Direct Permission from User
```
DELETE /api/admin/users/:id/permissions/:permission_id
```

**Response:**
```json
{
  "success": true,
  "message": "Permission removed from user successfully"
}
```

## Error Responses

All endpoints will return appropriate HTTP status codes and error messages in the following format:

```json
{
  "error": "Error message describing the issue"
}
```

Common error responses:
- 400: Bad Request - Invalid input data
- 401: Unauthorized - Missing or invalid authentication
- 403: Forbidden - Insufficient privileges
- 404: Not Found - Resource not found
- 500: Internal Server Error - Unexpected server error
