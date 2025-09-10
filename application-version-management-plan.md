# Application/Version Management Implementation Plan

## Overview
This document outlines the technical plan for implementing application/version management functionality in the Test Suite Manager application. The implementation will include:
1. Creating a settings dialog accessible from the AppBar
2. Adding database tables for applications and versions
3. Modifying the start execution dialog to use dropdowns for applications and versions
4. Adding validation to ensure at least one application/version is defined before opening the execution dialog

## Database Schema Changes

### New Tables

#### Applications Table
```sql
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Versions Table
```sql
CREATE TABLE IF NOT EXISTS versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  version_number TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  UNIQUE(application_id, version_number)
);
```

### Modified Tables

#### Suite Executions Table
Modify the existing `suite_executions` table to reference the new tables:
```sql
-- Add new columns
ALTER TABLE suite_executions ADD COLUMN application_id INTEGER;
ALTER TABLE suite_executions ADD COLUMN version_id INTEGER;

-- Add foreign key constraints
ALTER TABLE suite_executions ADD FOREIGN KEY (application_id) REFERENCES applications (id);
ALTER TABLE suite_executions ADD FOREIGN KEY (version_id) REFERENCES versions (id);

-- Populate the new columns with data from existing text columns
UPDATE suite_executions 
SET application_id = (SELECT id FROM applications WHERE name = suite_executions.application_name LIMIT 1),
    version_id = (SELECT id FROM versions WHERE version_number = suite_executions.application_version LIMIT 1);

-- Remove the old text columns (in a production environment, this would be done more carefully)
-- ALTER TABLE suite_executions DROP COLUMN application_name;
-- ALTER TABLE suite_executions DROP COLUMN application_version;
```

## API Endpoints

### Applications Endpoints
- `GET /api/applications` - Get all applications
- `POST /api/applications` - Create a new application
- `PUT /api/applications/:id` - Update an application
- `DELETE /api/applications/:id` - Delete an application

### Versions Endpoints
- `GET /api/applications/:id/versions` - Get all versions for an application
- `POST /api/applications/:id/versions` - Create a new version for an application
- `PUT /api/versions/:id` - Update a version
- `DELETE /api/versions/:id` - Delete a version

### Modified Suite Execution Endpoints
- `POST /api/test-suites/:id/start-execution` - Modified to accept application_id and version_id instead of text values
- `GET /api/suite-executions/:id` - Modified to include application and version details in response

## Component Structure

### Settings Dialog
A new `SettingsDialog` component will be created that can be accessed from the AppBar. This dialog will have:
- Tabs for managing Applications and Versions
- Forms for adding/editing applications and versions
- Lists showing existing applications and versions
- Delete functionality for applications and versions

### Modified Suite Execution Dialog
The existing suite execution dialog in `Dashboard.tsx` will be modified to:
- Replace text inputs for application name and version with dropdowns
- Populate dropdowns with data from the applications/versions API
- Submit application_id and version_id instead of text values

### AppBar Integration
A new button/entry will be added to the AppBar to access the settings dialog.

## State Management Approach

### Client-Side State
In the `Dashboard` component, we'll add:
- `applications` state to store the list of applications
- `versions` state to store the list of versions
- Loading and error states for API calls
- Functions to refresh the data when CRUD operations are performed

### Data Flow
1. On component mount, fetch applications and versions
2. When user opens the suite execution dialog, populate dropdowns with current data
3. When user performs CRUD operations in the settings dialog, update the local state
4. When suite execution is started, send application_id and version_id to the backend

## UI/UX Considerations

### Settings Dialog Design
- Use MUI Tabs to separate applications and versions management
- Use MUI Dialog, Table, and Form components for consistency
- Implement proper validation for forms
- Show loading indicators during API calls
- Display meaningful error messages
- Provide confirmation dialogs for delete operations

### Suite Execution Dialog Design
- Replace text inputs with Select components for applications and versions
- Implement cascading dropdowns where version dropdown is populated based on selected application
- Add validation to ensure both application and version are selected
- Disable the "Start Suite Execution" button until all required fields are filled

### Validation Mechanism
- Client-side validation to check if at least one application and version exist before allowing suite execution
- Server-side validation as a backup
- Clear error messages when validation fails
- Guidance for users on how to add applications/versions if none exist

## Implementation Sequence

1. **Database Changes**
   - Add new tables for applications and versions
   - Modify suite_executions table to reference new tables

2. **Backend API**
   - Implement new API endpoints for applications and versions
   - Modify existing suite execution endpoints
   - Update shared types

3. **Frontend Components**
   - Create SettingsDialog component
   - Modify Dashboard to include settings dialog and state management
   - Update suite execution dialog to use dropdowns
   - Add AppBar integration

4. **Testing and Validation**
   - Test all CRUD operations for applications and versions
   - Test suite execution with new dropdowns
   - Verify validation mechanisms
   - Test edge cases and error handling

## Migration Considerations

For existing data:
1. Create applications and versions from existing suite execution records
2. Update suite execution records to reference the new tables
3. Provide a migration script to handle this process

## Error Handling

- Network errors will be handled through the existing error context
- Validation errors will show appropriate user messages
- Database constraint violations will be handled gracefully
- Missing data scenarios will guide users on how to add required information

## Security Considerations

- All new endpoints will use the existing authentication middleware
- Input validation will be implemented on all forms
- Database constraints will prevent invalid data
- Proper error messages will avoid exposing internal details

## Performance Considerations

- Indexes will be added to foreign key columns
- Caching strategies may be implemented for frequently accessed data
- Pagination may be added for large lists of applications/versions