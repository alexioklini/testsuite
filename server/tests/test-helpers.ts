import db from '../database';

// Helper function to create a test user
export const createTestUser = (username: string, password_hash: string) => {
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, real_name, email, phone_number, is_2fa_enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(username, password_hash, 'Test User', 'test@example.com', null, 0);
  return result.lastInsertRowid as number;
};

// Helper function to create a test suite
export const createTestSuite = (name: string, description: string) => {
  const stmt = db.prepare('INSERT INTO test_suites (name, description) VALUES (?, ?)');
  const result = stmt.run(name, description);
  return result.lastInsertRowid as number;
};

// Helper function to create a test
export const createTest = (suite_id: number, area: string, short_name: string, manual_tasks: string, expected_results: string, is_mandatory: number) => {
  const stmt = db.prepare(`
    INSERT INTO tests (suite_id, area, short_name, manual_tasks, expected_results, is_mandatory)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(suite_id, area, short_name, manual_tasks, expected_results, is_mandatory);
  return result.lastInsertRowid as number;
};

// Helper function to create an application
export const createApplication = (name: string, description: string) => {
  const stmt = db.prepare('INSERT INTO applications (name, description) VALUES (?, ?)');
  const result = stmt.run(name, description);
  return result.lastInsertRowid as number;
};

// Helper function to create a version
export const createVersion = (application_id: number, version_number: string) => {
  const stmt = db.prepare('INSERT INTO versions (application_id, version_number) VALUES (?, ?)');
  const result = stmt.run(application_id, version_number);
  return result.lastInsertRowid as number;
};

// Helper function to delete all test data
export const deleteAllTestData = () => {
  // Delete in correct order to respect foreign key constraints
  db.prepare('DELETE FROM test_execution_files').run();
  db.prepare('DELETE FROM test_executions').run();
  db.prepare('DELETE FROM suite_executions').run();
  db.prepare('DELETE FROM tests').run();
  db.prepare('DELETE FROM test_suites').run();
  db.prepare('DELETE FROM versions').run();
  db.prepare('DELETE FROM applications').run();
  db.prepare('DELETE FROM user_2fa_codes').run();
  db.prepare('DELETE FROM user_permissions').run();
  db.prepare('DELETE FROM user_roles').run();
  db.prepare('DELETE FROM roles').run();
  db.prepare('DELETE FROM permissions').run();
  db.prepare('DELETE FROM users').run();
};