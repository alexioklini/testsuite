import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = path.join(__dirname, 'testsuite.db');
console.log('Database path:', dbPath);
const db = new Database(dbPath);
console.log('Database initialized');

// Enable foreign keys
db.pragma('foreign_keys = ON');
console.log('Foreign keys enabled');

// Create TestSuites table
console.log('Creating test_suites table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS test_suites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('test_suites table created');

// Create Tests table
db.exec(`
  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_id INTEGER NOT NULL,
    area TEXT NOT NULL,
    short_name TEXT NOT NULL,
    manual_tasks TEXT,
    expected_results TEXT,
    is_mandatory BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'not_tested')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (suite_id) REFERENCES test_suites (id) ON DELETE CASCADE
  );
`);

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tests_suite_id ON tests (suite_id);
  CREATE INDEX IF NOT EXISTS idx_tests_status ON tests (status);
  CREATE INDEX IF NOT EXISTS idx_tests_area ON tests (area);
`);

// Create Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    is_2fa_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration logic to add real_name and email columns to existing users table
try {
  // Check if the real_name column exists by trying to select from it
  db.exec("SELECT real_name FROM users LIMIT 1");
} catch (error) {
  // If we get an error, the column doesn't exist and we need to add it
  if (error instanceof Error && error.message.includes('no such column')) {
    console.log('Adding real_name column to users table...');
    try {
      db.exec('ALTER TABLE users ADD COLUMN real_name TEXT');
      console.log('real_name column added successfully');
    } catch (alterError) {
      console.log('real_name column may already exist or error occurred:', alterError);
    }
  } else {
    // Re-throw any other errors
    throw error;
  }
}

try {
  // Check if the email column exists by trying to select from it
  db.exec("SELECT email FROM users LIMIT 1");
} catch (error) {
  // If we get an error, the column doesn't exist and we need to add it
  if (error instanceof Error && error.message.includes('no such column')) {
    console.log('Adding email column to users table...');
    try {
      db.exec('ALTER TABLE users ADD COLUMN email TEXT');
      // Add unique constraint separately since SQLite doesn't support adding UNIQUE constraint directly
      console.log('email column added successfully');
    } catch (alterError) {
      console.log('email column may already exist or error occurred:', alterError);
    }
  } else {
    // Re-throw any other errors
    throw error;
  }
}

// Create Test Execution Files table (for evidence attachments)
db.exec(`
CREATE TABLE IF NOT EXISTS test_execution_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_execution_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_execution_id) REFERENCES test_executions (id) ON DELETE CASCADE
);
`);

// Create User 2FA Codes table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_2fa_codes (
    user_id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

// Create Applications table
console.log('Creating applications table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('applications table created');

// Create Versions table
console.log('Creating versions table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    version_number TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
    UNIQUE(application_id, version_number)
  );
`);
console.log('versions table created');

// Create Suite Executions table
console.log('Creating suite_executions table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS suite_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_id INTEGER NOT NULL,
    execution_name TEXT NOT NULL,
    tester_name TEXT NOT NULL,
    application_name TEXT NOT NULL,
    application_version TEXT NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (suite_id) REFERENCES test_suites (id) ON DELETE CASCADE
  );
`);
console.log('suite_executions table created');
// Update existing suite_executions table to add application_id and version_id columns
// This is needed because CREATE TABLE IF NOT EXISTS doesn't update existing tables
try {
  // Check if the new columns exist by trying to select from them
  db.exec("SELECT application_id, version_id FROM suite_executions LIMIT 1");
} catch (error) {
  // If we get an error, the columns don't exist and we need to recreate the table
  if (error instanceof Error && error.message.includes('no such column')) {
    console.log('Updating suite_executions table to add application_id and version_id columns...');

    // Rename the existing table
    db.exec('ALTER TABLE suite_executions RENAME TO suite_executions_old');

    // Create the new table with updated schema
    db.exec(`
      CREATE TABLE suite_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suite_id INTEGER NOT NULL,
        execution_name TEXT NOT NULL,
        tester_name TEXT NOT NULL,
        application_name TEXT NOT NULL,
        application_version TEXT NOT NULL,
        application_id INTEGER,
        version_id INTEGER,
        status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (suite_id) REFERENCES test_suites (id) ON DELETE CASCADE,
        FOREIGN KEY (application_id) REFERENCES applications (id),
        FOREIGN KEY (version_id) REFERENCES versions (id)
      );
    `);

    // Copy data from old table to new table
    db.exec(`
      INSERT INTO suite_executions (id, suite_id, execution_name, tester_name, application_name, application_version, status, started_at, completed_at)
      SELECT id, suite_id, execution_name, tester_name, application_name, application_version, status, started_at, completed_at
      FROM suite_executions_old
    `);

    // Drop the old table
    db.exec('DROP TABLE suite_executions_old');

    console.log('suite_executions table updated successfully');
  } else {
    // Re-throw any other errors
    throw error;
  }
}


// Migration logic to handle existing data
// Create applications and versions from existing suite execution records
// and update suite execution records to reference the new tables
try {
  // Check if there are any suite executions with application_name and application_version
  const suiteExecutions = db.prepare("SELECT DISTINCT application_name, application_version FROM suite_executions WHERE application_name IS NOT NULL AND application_version IS NOT NULL").all() as { application_name: string; application_version: string }[];
  
  // Process each unique application/version combination
  for (const execution of suiteExecutions) {
    // Create application if it doesn't exist
    const application = db.prepare("SELECT id FROM applications WHERE name = ?").get(execution.application_name) as { id: number } | undefined;
    let applicationId: number;
    
    if (!application) {
      const insertApp = db.prepare("INSERT INTO applications (name) VALUES (?)");
      const result = insertApp.run(execution.application_name);
      applicationId = Number(result.lastInsertRowid);
      console.log('Created application: ' + execution.application_name + ' with ID ' + applicationId);
    } else {
      applicationId = application.id;
    }
    
    // Create version if it doesn't exist
    const version = db.prepare("SELECT id FROM versions WHERE application_id = ? AND version_number = ?").get(applicationId, execution.application_version) as { id: number } | undefined;
    let versionId: number;
    
    if (!version) {
      const insertVersion = db.prepare("INSERT INTO versions (application_id, version_number) VALUES (?, ?)");
      const result = insertVersion.run(applicationId, execution.application_version);
      versionId = Number(result.lastInsertRowid);
      console.log('Created version: ' + execution.application_version + ' for application ID ' + applicationId + ' with ID ' + versionId);
    } else {
      versionId = version.id;
    }
    
    // Update suite executions to reference the new tables
    const updateExecutions = db.prepare("UPDATE suite_executions SET application_id = ?, version_id = ? WHERE application_name = ? AND application_version = ?");
    const updateResult = updateExecutions.run(applicationId, versionId, execution.application_name, execution.application_version);
    console.log('Updated ' + updateResult.changes + ' suite executions for application ' + execution.application_name + ' version ' + execution.application_version);
  }
  
  console.log('Data migration completed successfully');
} catch (error) {
  console.error('Error during data migration:', error);
}

// Create Test Executions table (linked to suite executions)
db.exec(`
  CREATE TABLE IF NOT EXISTS test_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_execution_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'not_tested')),
    result_notes TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (suite_execution_id) REFERENCES suite_executions (id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE
  );
`);

// Update existing test_executions table to include 'not_tested' in status constraint
// This is needed because CREATE TABLE IF NOT EXISTS doesn't update existing tables
try {
  // Temporarily disable foreign keys to allow dummy insert for constraint check
  db.pragma('foreign_keys = OFF');
  // First, check if the constraint needs to be updated by trying to insert a 'not_tested' record
  db.exec("INSERT INTO test_executions (suite_execution_id, test_id, status) VALUES (0, 0, 'not_tested')");
  // If successful, delete the test record
  db.exec("DELETE FROM test_executions WHERE suite_execution_id = 0 AND test_id = 0 AND status = 'not_tested'");
  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
} catch (error) {
  // Re-enable foreign keys in case of error
  db.pragma('foreign_keys = ON');
  // If we get a constraint error, we need to recreate the table
  if (error instanceof Error && (error.message.includes('CHECK constraint failed') || error.message.includes('FOREIGN KEY constraint failed'))) {
    console.log('Updating test_executions table to include not_tested status...');

    // Rename the existing table
    db.exec('ALTER TABLE test_executions RENAME TO test_executions_old');

    // Create the new table with updated constraint
    db.exec(`
      CREATE TABLE test_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suite_execution_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'not_tested')),
        result_notes TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (suite_execution_id) REFERENCES suite_executions (id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE
      );
    `);

    // Copy data from old table to new table
    db.exec(`
      INSERT INTO test_executions (id, suite_execution_id, test_id, status, result_notes, executed_at)
      SELECT id, suite_execution_id, test_id, status, result_notes, executed_at
      FROM test_executions_old
    `);

    // Drop the old table
    db.exec('DROP TABLE test_executions_old');

    console.log('test_executions table updated successfully');
  } else {
    // Re-throw any other errors
    throw error;
  }
}

// Create Permissions table
console.log('Creating permissions table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    UNIQUE(task_name, action)
  );
`);
console.log('permissions table created');

// Create Roles table
console.log('Creating roles table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );
`);
console.log('roles table created');

// Create Role Permissions table (many-to-many)
console.log('Creating role_permissions table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
  );
`);
console.log('role_permissions table created');

// Create User Roles table (many-to-many)
console.log('Creating user_roles table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
  );
`);
console.log('user_roles table created');

// Create User Permissions table (many-to-many)
console.log('Creating user_permissions table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    UNIQUE(user_id, permission_id)
  );
`);
console.log('user_permissions table created');

export default db;
// Create indexes for applications, versions, suite_executions, roles, and permissions
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_applications_name ON applications (name);
  CREATE INDEX IF NOT EXISTS idx_versions_application_id ON versions (application_id);
  CREATE INDEX IF NOT EXISTS idx_versions_version_number ON versions (version_number);
  CREATE INDEX IF NOT EXISTS idx_suite_executions_application_id ON suite_executions (application_id);
  CREATE INDEX IF NOT EXISTS idx_suite_executions_version_id ON suite_executions (version_id);
  CREATE INDEX IF NOT EXISTS idx_permissions_task_action ON permissions (task_name, action);
  CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
  CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
  CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
  CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);
  CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions (user_id);
  CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions (permission_id);
`);
// Seed initial permissions data
console.log('Seeding permissions data...');
const permissionsData = [
  { task_name: 'testsuite_management', action: 'read', description: 'View test suites' },
  { task_name: 'testsuite_management', action: 'write', description: 'Create/edit test suites' },
  { task_name: 'testsuite_management', action: 'approve', description: 'Approve test suites' },
  { task_name: 'testsuite_management', action: 'delete', description: 'Delete test suites' },
  { task_name: 'test_management', action: 'read', description: 'View tests' },
  { task_name: 'test_management', action: 'write', description: 'Create/edit tests' },
  { task_name: 'test_management', action: 'approve', description: 'Approve tests' },
  { task_name: 'test_management', action: 'delete', description: 'Delete tests' },
  { task_name: 'testsuite_execution', action: 'read', description: 'View test suite executions' },
  { task_name: 'testsuite_execution', action: 'write', description: 'Execute test suites' },
  { task_name: 'testsuite_execution', action: 'approve', description: 'Approve test suite executions' },
  { task_name: 'testsuite_execution', action: 'delete', description: 'Delete test suite executions' },
  { task_name: 'test_execution', action: 'read', description: 'View test executions' },
  { task_name: 'test_execution', action: 'write', description: 'Execute tests' },
  { task_name: 'test_execution', action: 'approve', description: 'Approve test executions' },
  { task_name: 'test_execution', action: 'delete', description: 'Delete test executions' },
  { task_name: 'administration', action: 'read', description: 'View administration panel' },
  { task_name: 'administration', action: 'write', description: 'Manage system settings' },
  { task_name: 'administration', action: 'approve', description: 'Approve administrative changes' },
  { task_name: 'administration', action: 'delete', description: 'Delete system data' }
];

const insertPermission = db.prepare(`
  INSERT OR IGNORE INTO permissions (task_name, action, description)
  VALUES (?, ?, ?)
`);

for (const permission of permissionsData) {
  insertPermission.run(permission.task_name, permission.action, permission.description);
}
console.log('Permissions data seeded');

// Seed initial roles data
console.log('Seeding roles data...');
const rolesData = [
  { name: 'Administrator', description: 'Full system access' },
  { name: 'Test Manager', description: 'Manages test suites and tests' },
  { name: 'Tester', description: 'Can execute tests' },
  { name: 'Viewer', description: 'Read-only access' }
];

const insertRole = db.prepare(`
  INSERT OR IGNORE INTO roles (name, description)
  VALUES (?, ?)
`);

for (const role of rolesData) {
  insertRole.run(role.name, role.description);
}
console.log('Roles data seeded');

// Seed role permissions data
console.log('Seeding role permissions data...');
// Get all permissions
const allPermissions = db.prepare('SELECT id, task_name, action FROM permissions').all() as { id: number; task_name: string; action: string }[];

// Define role permissions mapping
const rolePermissionsMap: Record<string, { task_name: string; action: string }[]> = {
  Administrator: [  // Full access to everything
    { task_name: 'testsuite_management', action: 'read' },
    { task_name: 'testsuite_management', action: 'write' },
    { task_name: 'testsuite_management', action: 'approve' },
    { task_name: 'testsuite_management', action: 'delete' },
    { task_name: 'test_management', action: 'read' },
    { task_name: 'test_management', action: 'write' },
    { task_name: 'test_management', action: 'approve' },
    { task_name: 'test_management', action: 'delete' },
    { task_name: 'testsuite_execution', action: 'read' },
    { task_name: 'testsuite_execution', action: 'write' },
    { task_name: 'testsuite_execution', action: 'approve' },
    { task_name: 'testsuite_execution', action: 'delete' },
    { task_name: 'test_execution', action: 'read' },
    { task_name: 'test_execution', action: 'write' },
    { task_name: 'test_execution', action: 'approve' },
    { task_name: 'test_execution', action: 'delete' },
    { task_name: 'administration', action: 'read' },
    { task_name: 'administration', action: 'write' },
    { task_name: 'administration', action: 'approve' },
    { task_name: 'administration', action: 'delete' }
  ],
  TestManager: [  // Can manage test suites and tests, and execute them
    { task_name: 'testsuite_management', action: 'read' },
    { task_name: 'testsuite_management', action: 'write' },
    { task_name: 'testsuite_management', action: 'approve' },
    { task_name: 'test_management', action: 'read' },
    { task_name: 'test_management', action: 'write' },
    { task_name: 'test_management', action: 'approve' },
    { task_name: 'testsuite_execution', action: 'read' },
    { task_name: 'testsuite_execution', action: 'write' },
    { task_name: 'test_execution', action: 'read' },
    { task_name: 'test_execution', action: 'write' }
  ],
  Tester: [  // Can only execute tests
    { task_name: 'testsuite_execution', action: 'read' },
    { task_name: 'testsuite_execution', action: 'write' },
    { task_name: 'test_execution', action: 'read' },
    { task_name: 'test_execution', action: 'write' }
  ],
  Viewer: [  // Read-only access
    { task_name: 'testsuite_management', action: 'read' },
    { task_name: 'test_management', action: 'read' },
    { task_name: 'testsuite_execution', action: 'read' },
    { task_name: 'test_execution', action: 'read' }
  ]
};

// Get all roles
const allRoles = db.prepare('SELECT id, name FROM roles').all() as { id: number; name: string }[];

// Prepare statements for inserting role permissions
const insertRolePermission = db.prepare(`
  INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
  VALUES (?, ?)
`);

// Assign permissions to each role
for (const role of allRoles) {
  const roleName = role.name;
  // Use the role name with spaces removed for mapping lookup
  const roleNameNoSpaces = roleName.replace(/\s+/g, '');
  const permissionsForRole = rolePermissionsMap[roleNameNoSpaces];
  
  if (permissionsForRole) {
    for (const permissionSpec of permissionsForRole) {
      // Find the matching permission
      const permission = allPermissions.find(
        p => p.task_name === permissionSpec.task_name && p.action === permissionSpec.action
      );
      
      if (permission) {
        insertRolePermission.run(role.id, permission.id);
      }
    }
  }
}

console.log('Role permissions data seeded');

// Function to ensure database is properly initialized
export function ensureDatabaseInitialized() {
  console.log('Ensuring database is properly initialized...');
  
  // Check if permissions exist, if not seed them
  const permissionCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get() as { count: number };
  if (permissionCount.count === 0) {
    console.log('Seeding permissions data...');
    const permissionsData = [
      { task_name: 'testsuite_management', action: 'read', description: 'View test suites' },
      { task_name: 'testsuite_management', action: 'write', description: 'Create/edit test suites' },
      { task_name: 'testsuite_management', action: 'approve', description: 'Approve test suites' },
      { task_name: 'testsuite_management', action: 'delete', description: 'Delete test suites' },
      { task_name: 'test_management', action: 'read', description: 'View tests' },
      { task_name: 'test_management', action: 'write', description: 'Create/edit tests' },
      { task_name: 'test_management', action: 'approve', description: 'Approve tests' },
      { task_name: 'test_management', action: 'delete', description: 'Delete tests' },
      { task_name: 'testsuite_execution', action: 'read', description: 'View test suite executions' },
      { task_name: 'testsuite_execution', action: 'write', description: 'Execute test suites' },
      { task_name: 'testsuite_execution', action: 'approve', description: 'Approve test suite executions' },
      { task_name: 'testsuite_execution', action: 'delete', description: 'Delete test suite executions' },
      { task_name: 'test_execution', action: 'read', description: 'View test executions' },
      { task_name: 'test_execution', action: 'write', description: 'Execute tests' },
      { task_name: 'test_execution', action: 'approve', description: 'Approve test executions' },
      { task_name: 'test_execution', action: 'delete', description: 'Delete test executions' },
      { task_name: 'administration', action: 'read', description: 'View administration panel' },
      { task_name: 'administration', action: 'write', description: 'Manage system settings' },
      { task_name: 'administration', action: 'approve', description: 'Approve administrative changes' },
      { task_name: 'administration', action: 'delete', description: 'Delete system data' }
    ];

    const insertPermission = db.prepare(`
      INSERT OR IGNORE INTO permissions (task_name, action, description)
      VALUES (?, ?, ?)
    `);

    for (const permission of permissionsData) {
      insertPermission.run(permission.task_name, permission.action, permission.description);
    }
    console.log('Permissions data seeded');
  }

  // Check if roles exist, if not seed them
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (roleCount.count === 0) {
    console.log('Seeding roles data...');
    const rolesData = [
      { name: 'Administrator', description: 'Full system access' },
      { name: 'Test Manager', description: 'Manages test suites and tests' },
      { name: 'Tester', description: 'Can execute tests' },
      { name: 'Viewer', description: 'Read-only access' }
    ];

    const insertRole = db.prepare(`
      INSERT OR IGNORE INTO roles (name, description)
      VALUES (?, ?)
    `);

    for (const role of rolesData) {
      insertRole.run(role.name, role.description);
    }
    console.log('Roles data seeded');
  }

  // Check if role permissions exist, if not seed them
  const rolePermissionCount = db.prepare('SELECT COUNT(*) as count FROM role_permissions').get() as { count: number };
  if (rolePermissionCount.count === 0) {
    console.log('Seeding role permissions data...');
    // Get all permissions
    const allPermissions = db.prepare('SELECT id, task_name, action FROM permissions').all() as { id: number; task_name: string; action: string }[];

    // Define role permissions mapping
    const rolePermissionsMap: Record<string, { task_name: string; action: string }[]> = {
      Administrator: [  // Full access to everything
        { task_name: 'testsuite_management', action: 'read' },
        { task_name: 'testsuite_management', action: 'write' },
        { task_name: 'testsuite_management', action: 'approve' },
        { task_name: 'testsuite_management', action: 'delete' },
        { task_name: 'test_management', action: 'read' },
        { task_name: 'test_management', action: 'write' },
        { task_name: 'test_management', action: 'approve' },
        { task_name: 'test_management', action: 'delete' },
        { task_name: 'testsuite_execution', action: 'read' },
        { task_name: 'testsuite_execution', action: 'write' },
        { task_name: 'testsuite_execution', action: 'approve' },
        { task_name: 'testsuite_execution', action: 'delete' },
        { task_name: 'test_execution', action: 'read' },
        { task_name: 'test_execution', action: 'write' },
        { task_name: 'test_execution', action: 'approve' },
        { task_name: 'test_execution', action: 'delete' },
        { task_name: 'administration', action: 'read' },
        { task_name: 'administration', action: 'write' },
        { task_name: 'administration', action: 'approve' },
        { task_name: 'administration', action: 'delete' }
      ],
      TestManager: [  // Can manage test suites and tests, and execute them
        { task_name: 'testsuite_management', action: 'read' },
        { task_name: 'testsuite_management', action: 'write' },
        { task_name: 'testsuite_management', action: 'approve' },
        { task_name: 'test_management', action: 'read' },
        { task_name: 'test_management', action: 'write' },
        { task_name: 'test_management', action: 'approve' },
        { task_name: 'testsuite_execution', action: 'read' },
        { task_name: 'testsuite_execution', action: 'write' },
        { task_name: 'test_execution', action: 'read' },
        { task_name: 'test_execution', action: 'write' }
      ],
      Tester: [  // Can only execute tests
        { task_name: 'testsuite_execution', action: 'read' },
        { task_name: 'testsuite_execution', action: 'write' },
        { task_name: 'test_execution', action: 'read' },
        { task_name: 'test_execution', action: 'write' }
      ],
      Viewer: [  // Read-only access
        { task_name: 'testsuite_management', action: 'read' },
        { task_name: 'test_management', action: 'read' },
        { task_name: 'testsuite_execution', action: 'read' },
        { task_name: 'test_execution', action: 'read' }
      ]
    };

    // Get all roles
    const allRoles = db.prepare('SELECT id, name FROM roles').all() as { id: number; name: string }[];

    // Prepare statements for inserting role permissions
    const insertRolePermission = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
    `);

    // Assign permissions to each role
    for (const role of allRoles) {
      const roleName = role.name;
      // Use the role name with spaces removed for mapping lookup
      const roleNameNoSpaces = roleName.replace(/\s+/g, '');
      const permissionsForRole = rolePermissionsMap[roleNameNoSpaces];
      
      if (permissionsForRole) {
        for (const permissionSpec of permissionsForRole) {
          // Find the matching permission
          const permission = allPermissions.find(
            p => p.task_name === permissionSpec.task_name && p.action === permissionSpec.action
          );
          
          if (permission) {
            insertRolePermission.run(role.id, permission.id);
          }
        }
      }
    }
    console.log('Role permissions data seeded');
  }

  // Check if admin user exists, if not create it
  const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number } | undefined;
  if (!adminUser) {
    console.log('Creating admin user...');
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync('admin123', saltRounds);
    
    // Create the admin user
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, real_name, email, phone_number, is_2fa_enabled)
      VALUES (?, ?, ?, ?, NULL, 0)
    `);
    
    const userResult = insertUser.run('admin', hashedPassword, 'Administrator', 'admin@example.com');
    const userId = userResult.lastInsertRowid as number;
    console.log('Admin user created with ID:', userId);
    
    // Get the Administrator role
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('Administrator') as { id: number } | undefined;
    
    if (adminRole) {
      // Assign the Administrator role to the admin user
      const insertUserRole = db.prepare(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (?, ?)
      `);
      
      insertUserRole.run(userId, adminRole.id);
      console.log('Administrator role assigned to admin user');
    } else {
      console.log('Administrator role not found');
    }
  } else {
    console.log('Admin user already exists');
  }
  
  console.log('Database initialization completed');
}

console.log('Database initialization completed');