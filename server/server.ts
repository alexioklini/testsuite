import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import db, { ensureDatabaseInitialized } from './database';

// Authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    (req as any).user = user;
    next();
  });
};

// Mock SMS service
const sendSMS = (phoneNumber: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
    // In a real implementation, you would integrate with an SMS service provider here
    resolve(true);
  });
};

// Generate a random 6-digit code
const generate2FACode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const app = express();

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes for TestSuites

// GET /api/test-suites
app.get('/api/test-suites', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM test_suites');
    const suites = stmt.all();
    res.json(suites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test suites' });
  }
});

// POST /api/test-suites
app.post('/api/test-suites', authenticateToken, (req, res) => {
  try {
    const { name, description } = req.body;
    const stmt = db.prepare('INSERT INTO test_suites (name, description) VALUES (?, ?)');
    const result = stmt.run(name, description);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test suite' });
  }
});

// PUT /api/test-suites/:id
app.put('/api/test-suites/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const stmt = db.prepare('UPDATE test_suites SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(name, description, id);
    res.json({ message: 'Updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test suite' });
  }
});

// DELETE /api/test-suites/:id
app.delete('/api/test-suites/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM test_suites WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test suite' });
  }
});

// Routes for Tests

// GET /api/test-suites/:suiteId/tests
app.get('/api/test-suites/:suiteId/tests', authenticateToken, (req, res) => {
  try {
    const { suiteId } = req.params;
    const stmt = db.prepare('SELECT * FROM tests WHERE suite_id = ?');
    const tests = stmt.all(suiteId) as any[];

    // Convert is_mandatory to boolean
    const processedTests = tests.map(test => ({
      ...test,
      is_mandatory: Boolean(test.is_mandatory)
    }));

    res.json(processedTests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// POST /api/test-suites/:suiteId/tests
app.post('/api/test-suites/:suiteId/tests', authenticateToken, (req, res) => {
  try {
    const { suiteId } = req.params;
    const { area, short_name, manual_tasks, expected_results, is_mandatory } = req.body;
    const stmt = db.prepare('INSERT INTO tests (suite_id, area, short_name, manual_tasks, expected_results, is_mandatory) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(suiteId, area, short_name, manual_tasks, expected_results, is_mandatory ? 1 : 0);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// PUT /api/tests/:id
app.put('/api/tests/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { area, short_name, manual_tasks, expected_results, is_mandatory, status } = req.body;
    const stmt = db.prepare('UPDATE tests SET area = ?, short_name = ?, manual_tasks = ?, expected_results = ?, is_mandatory = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(area, short_name, manual_tasks, expected_results, is_mandatory ? 1 : 0, status, id);
    res.json({ message: 'Updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test' });
  }
});

// DELETE /api/tests/:id
app.delete('/api/tests/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM tests WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test' });
  }
});
// Application endpoints

// GET /api/applications - Get all applications
app.get('/api/applications', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM applications ORDER BY name');
    const applications = stmt.all();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /api/applications - Create a new application
app.post('/api/applications', authenticateToken, (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Application name is required' });
    }
    
    // Validate name length
    if (name.length > 100) {
      return res.status(400).json({ error: 'Application name must be less than 100 characters' });
    }
    
    // Validate description length
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description must be less than 500 characters' });
    }
    
    const stmt = db.prepare('INSERT INTO applications (name, description) VALUES (?, ?)');
    const result = stmt.run(name.trim(), description ? description.trim() : null);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Application created successfully' });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An application with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PUT /api/applications/:id - Update an application
app.put('/api/applications/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Validate ID
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Application name is required' });
    }
    
    // Validate name length
    if (name.length > 100) {
      return res.status(400).json({ error: 'Application name must be less than 100 characters' });
    }
    
    // Validate description length
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description must be less than 500 characters' });
    }
    
    const stmt = db.prepare('UPDATE applications SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(name.trim(), description ? description.trim() : null, idNum);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application updated successfully' });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An application with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// DELETE /api/applications/:id - Delete an application
app.delete('/api/applications/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    const stmt = db.prepare('DELETE FROM applications WHERE id = ?');
    const result = stmt.run(idNum);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error: any) {
    // Handle foreign key constraint violation
    if (error.message && (error.message.includes('FOREIGN KEY constraint failed') || error.message.includes('SQLITE_CONSTRAINT_FOREIGNKEY'))) {
      return res.status(400).json({ error: 'Cannot delete application because it is referenced by existing versions or suite executions' });
    }
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Version endpoints

// GET /api/versions - Get all versions (with optional application_id filter)
app.get('/api/versions', authenticateToken, (req, res) => {
  try {
    const { application_id } = req.query;
    
    let stmt;
    let versions;
    
    if (application_id) {
      // Validate application_id
      const appIdNum = parseInt(application_id as string);
      if (isNaN(appIdNum) || appIdNum <= 0) {
        return res.status(400).json({ error: 'Invalid application ID' });
      }
      
      stmt = db.prepare('SELECT * FROM versions WHERE application_id = ? ORDER BY version_number');
      versions = stmt.all(appIdNum);
    } else {
      stmt = db.prepare('SELECT * FROM versions ORDER BY application_id, version_number');
      versions = stmt.all();
    }
    
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// POST /api/versions - Create a new version
app.post('/api/versions', authenticateToken, (req, res) => {
  try {
    const { application_id, version_number } = req.body;
    
    // Validate required fields
    if (!application_id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }
    
    if (!version_number || version_number.trim() === '') {
      return res.status(400).json({ error: 'Version number is required' });
    }
    
    // Validate application_id
    const appIdNum = parseInt(application_id);
    if (isNaN(appIdNum) || appIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    // Validate version number length
    if (version_number.length > 50) {
      return res.status(400).json({ error: 'Version number must be less than 50 characters' });
    }
    
    // Check if application exists
    const appStmt = db.prepare('SELECT id FROM applications WHERE id = ?');
    const application = appStmt.get(appIdNum);
    if (!application) {
      return res.status(400).json({ error: 'Application not found' });
    }
    
    const stmt = db.prepare('INSERT INTO versions (application_id, version_number) VALUES (?, ?)');
    const result = stmt.run(appIdNum, version_number.trim());
    res.status(201).json({ id: result.lastInsertRowid, message: 'Version created successfully' });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A version with this number already exists for this application' });
    }
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// PUT /api/versions/:id - Update a version
app.put('/api/versions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { version_number } = req.body;
    
    // Validate ID
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }
    
    // Validate required fields
    if (!version_number || version_number.trim() === '') {
      return res.status(400).json({ error: 'Version number is required' });
    }
    
    // Validate version number length
    if (version_number.length > 50) {
      return res.status(400).json({ error: 'Version number must be less than 50 characters' });
    }
    
    const stmt = db.prepare('UPDATE versions SET version_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(version_number.trim(), idNum);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json({ message: 'Version updated successfully' });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A version with this number already exists for this application' });
    }
    res.status(500).json({ error: 'Failed to update version' });
  }
});

// DELETE /api/versions/:id - Delete a version
app.delete('/api/versions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }
    
    const stmt = db.prepare('DELETE FROM versions WHERE id = ?');
    const result = stmt.run(idNum);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json({ message: 'Version deleted successfully' });
  } catch (error: any) {
    // Handle foreign key constraint violation
    if (error.message && (error.message.includes('FOREIGN KEY constraint failed') || error.message.includes('SQLITE_CONSTRAINT_FOREIGNKEY'))) {
      return res.status(400).json({ error: 'Cannot delete version because it is referenced by existing suite executions' });
    }
    res.status(500).json({ error: 'Failed to delete version' });
  }
});

// Bulk operation: Run suite
app.post('/api/test-suites/:id/run', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('UPDATE tests SET status = \'in_progress\', updated_at = CURRENT_TIMESTAMP WHERE suite_id = ?');
    stmt.run(id);
    res.json({ message: 'Suite started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start suite' });
  }
});

// Suite Execution endpoints

// POST /api/test-suites/:id/start-execution - Start executing a test suite
app.post('/api/test-suites/:id/start-execution', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { execution_name, tester_name, application_id, version_id } = req.body;

    // Validate required fields
    if (!application_id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }
    
    if (!version_id) {
      return res.status(400).json({ error: 'Version ID is required' });
    }

    // Validate application_id
    const appIdNum = parseInt(application_id);
    if (isNaN(appIdNum) || appIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    
    // Validate version_id
    const versionIdNum = parseInt(version_id);
    if (isNaN(versionIdNum) || versionIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    // Check if the suite has any tests
    const getTestsStmt = db.prepare('SELECT id FROM tests WHERE suite_id = ?');
    const tests = getTestsStmt.all(id) as { id: number }[];
    
    if (tests.length === 0) {
      return res.status(400).json({
        error: 'Cannot start execution: No tests defined for this test suite. Please add tests before executing.'
      });
    }

    // Verify that the application and version exist and are related
    const appStmt = db.prepare('SELECT name FROM applications WHERE id = ?');
    const application = appStmt.get(appIdNum) as { name: string } | undefined;
    
    if (!application) {
      return res.status(400).json({ error: 'Application not found' });
    }
    
    const versionStmt = db.prepare('SELECT version_number FROM versions WHERE id = ? AND application_id = ?');
    const version = versionStmt.get(versionIdNum, appIdNum) as { version_number: string } | undefined;
    
    if (!version) {
      return res.status(400).json({ error: 'Version not found or does not belong to the specified application' });
    }

    // Create suite execution record
    const stmt = db.prepare(`
      INSERT INTO suite_executions (suite_id, execution_name, tester_name, application_id, version_id, application_name, application_version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(id, execution_name, tester_name, appIdNum, versionIdNum, application.name, version.version_number);

    // Create test execution records for each test
    const testExecutionStmt = db.prepare(`
      INSERT INTO test_executions (suite_execution_id, test_id, status)
      VALUES (?, ?, 'pending')
    `);

    tests.forEach(test => {
      testExecutionStmt.run(result.lastInsertRowid, test.id);
    });

    // Update all tests in suite to pending status
    const updateTestsStmt = db.prepare('UPDATE tests SET status = \'pending\', updated_at = CURRENT_TIMESTAMP WHERE suite_id = ?');
    updateTestsStmt.run(id);

    res.json({
      suite_execution_id: result.lastInsertRowid,
      message: 'Suite execution started',
      test_count: tests.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start suite execution' });
  }
});

// 2FA enrollment endpoint
app.post('/api/auth/2fa/enroll', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    
    // Update user with phone number and enable 2FA
    const stmt = db.prepare('UPDATE users SET phone_number = ?, is_2fa_enabled = 1 WHERE id = ?');
    const result = stmt.run(phoneNumber, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: '2FA enrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll 2FA' });
  }
});

// Send 2FA code endpoint
app.post('/api/auth/2fa/send-code', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Get user with 2FA enabled
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_2fa_enabled = 1');
    const user = userStmt.get(userId) as { id: number; username: string; phone_number: string } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found or 2FA not enabled' });
    }
    
    if (!user.phone_number) {
      return res.status(400).json({ error: 'Phone number not set for user' });
    }
    
    // Generate and store 2FA code (in a real app, you'd use a proper storage like Redis)
    const code = generate2FACode();
    const codeStmt = db.prepare('INSERT OR REPLACE INTO user_2fa_codes (user_id, code, expires_at) VALUES (?, ?, datetime(\'now\', \'+5 minutes\'))');
    codeStmt.run(userId, code);
    
    // Send SMS
    const message = `Your verification code is: ${code}`;
    await sendSMS(user.phone_number, message);
    
    res.json({ message: '2FA code sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send 2FA code' });
  }
});

// Verify 2FA code endpoint
app.post('/api/auth/2fa/verify', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    // Get stored code
    const codeStmt = db.prepare('SELECT * FROM user_2fa_codes WHERE user_id = ? AND expires_at > datetime(\'now\')');
    const storedCode = codeStmt.get(userId) as { code: string; expires_at: string } | undefined;
    
    if (!storedCode) {
      return res.status(400).json({ error: 'No valid code found for user' });
    }
    
    if (storedCode.code !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    
    // Delete used code
    const deleteStmt = db.prepare('DELETE FROM user_2fa_codes WHERE user_id = ?');
    deleteStmt.run(userId);
    
    // Generate JWT token
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { id: number; username: string } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret_key');
    
    res.json({ token, message: '2FA verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify 2FA code' });
  }
});

// Modified login endpoint to support 2FA
app.post('/api/auth/login-2fa', async (req, res) => {
  try {
    const { username, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as { id: number; username: string; password_hash: string; is_2fa_enabled: number } | undefined;
    
    if (user && await bcrypt.compare(password, user.password_hash)) {
      // Check if 2FA is enabled
      if (user.is_2fa_enabled) {
        // Send 2FA code
        const code = generate2FACode();
        const codeStmt = db.prepare('INSERT OR REPLACE INTO user_2fa_codes (user_id, code, expires_at) VALUES (?, ?, datetime(\'now\', \'+5 minutes\'))');
        codeStmt.run(user.id, code);
        
        // In a real app, you would send the SMS here
        // For now, we'll just return a response indicating 2FA is required
        res.json({
          requires2FA: true,
          userId: user.id,
          message: '2FA required. Code sent to your phone.'
        });
      } else {
        // Generate JWT token directly if 2FA is not enabled
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret_key');
        res.json({ token, requires2FA: false });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user info endpoint
app.get('/api/auth/user', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const stmt = db.prepare('SELECT id, username, real_name, email, phone_number, is_2fa_enabled, created_at FROM users WHERE id = ?');
    const user = stmt.get(userId) as { id: number; username: string; real_name: string; email: string; phone_number: string; is_2fa_enabled: number; created_at: string } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      email: user.email,
      phone_number: user.phone_number,
      is_2fa_enabled: Boolean(user.is_2fa_enabled),
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Get user permissions endpoint
app.get('/api/auth/user/permissions', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Get permissions from user_roles and role_permissions
    const rolePermissionsStmt = db.prepare(`
      SELECT DISTINCT p.task_name, p.action
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ?
    `);
    
    // Get direct user permissions
    const userPermissionsStmt = db.prepare(`
      SELECT DISTINCT p.task_name, p.action
      FROM users u
      JOIN user_permissions up ON u.id = up.user_id
      JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ?
    `);
    
    const rolePermissions = rolePermissionsStmt.all(userId) as { task_name: string; action: string }[];
    const userPermissions = userPermissionsStmt.all(userId) as { task_name: string; action: string }[];
    
    // Combine and deduplicate permissions
    const allPermissions = [...rolePermissions, ...userPermissions];
    const uniquePermissions = Array.from(
      new Set(allPermissions.map(p => `${p.task_name}:${p.action}`))
    ).map(permission => {
      const [task_name, action] = permission.split(':');
      return { task_name, action };
    });
    
    res.json(uniquePermissions);
  } catch (error) {
    console.error('Failed to fetch user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});
// User management endpoints for administration panel

// GET /api/admin/users - Get all users (for administration panel)
app.get('/api/admin/users', authenticateToken, (req, res) => {
  try {
    // First, verify that the requesting user has administration permissions
    const userId = (req as any).user.id;
    
    // Check if user has administration read permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Get all users with their roles
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.email, u.phone_number, u.is_2fa_enabled, u.created_at,
             GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.username, u.real_name, u.email, u.phone_number, u.is_2fa_enabled, u.created_at
      ORDER BY u.username
    `);
    
    const users = stmt.all() as { id: number; username: string; real_name: string; email: string; phone_number: string; is_2fa_enabled: number; created_at: string; roles: string }[];
    
    // Process users to format roles properly
    const processedUsers = users.map(user => ({
      ...user,
      is_2fa_enabled: Boolean(user.is_2fa_enabled),
      roles: user.roles ? user.roles.split(',') : []
    }));
    
    res.json(processedUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Get specific user details
app.get('/api/admin/users/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user has administration read permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Get user details
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.email, u.phone_number, u.is_2fa_enabled, u.created_at,
             GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id, u.username, u.real_name, u.email, u.phone_number, u.is_2fa_enabled, u.created_at
    `);
    
    const user = stmt.get(targetUserId) as { id: number; username: string; real_name: string; email: string; phone_number: string; is_2fa_enabled: number; created_at: string; roles: string } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Process user to format roles properly
    const processedUser = {
      ...user,
      is_2fa_enabled: Boolean(user.is_2fa_enabled),
      roles: user.roles ? user.roles.split(',') : []
    };
    
    res.json(processedUser);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/admin/users/:id/deactivate - Deactivate user account
app.put('/api/admin/users/:id/deactivate', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Prevent users from deactivating their own account
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    // Deactivate user by deleting from database
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(targetUserId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also delete related records
    const deleteUserRolesStmt = db.prepare('DELETE FROM user_roles WHERE user_id = ?');
    deleteUserRolesStmt.run(targetUserId);
    
    const deleteUserPermissionsStmt = db.prepare('DELETE FROM user_permissions WHERE user_id = ?');
    deleteUserPermissionsStmt.run(targetUserId);
    
    const deleteUser2faCodesStmt = db.prepare('DELETE FROM user_2fa_codes WHERE user_id = ?');
    deleteUser2faCodesStmt.run(targetUserId);
    
    res.json({ message: 'User account deactivated successfully' });
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// PUT /api/admin/users/:id/reset-password - Reset user password
app.put('/api/admin/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    // Validate ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    const result = stmt.run(hash, targetUserId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Failed to reset password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PUT /api/admin/users/:id/update-info - Update user real_name and email
app.put('/api/admin/users/:id/update-info', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = parseInt(req.params.id);
    const { real_name, email } = req.body;
    
    // Validate ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    // Update user real_name and email
    const stmt = db.prepare('UPDATE users SET real_name = ?, email = ? WHERE id = ?');
    const result = stmt.run(
      real_name && real_name.trim() !== '' ? real_name.trim() : null,
      email && email.trim() !== '' ? email.trim() : null,
      targetUserId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User information updated successfully' });
  } catch (error: any) {
    // Handle unique constraint violation for email
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    console.error('Failed to update user information:', error);
    res.status(500).json({ error: 'Failed to update user information' });
  }
});

// Role and Permission management endpoints for administration panel

// GET /api/admin/roles - Get all roles
app.get('/api/admin/roles', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Check if user has administration read permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Get all roles with their permissions
    const rolesStmt = db.prepare('SELECT * FROM roles ORDER BY name');
    const roles = rolesStmt.all() as { id: number; name: string; description: string }[];
    
    // Get permissions for each role
    const rolePermissionsStmt = db.prepare(`
      SELECT p.task_name, p.action, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.task_name, p.action
    `);
    
    // Add permissions to each role
    const rolesWithPermissions = roles.map(role => {
      const permissions = rolePermissionsStmt.all(role.id) as { task_name: string; action: string; description: string }[];
      return {
        ...role,
        permissions
      };
    });
    
    res.json(rolesWithPermissions);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/admin/roles - Create a new role
app.post('/api/admin/roles', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, permissions } = req.body;
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Validate name length
    if (name.length > 50) {
      return res.status(400).json({ error: 'Role name must be less than 50 characters' });
    }
    
    // Validate description length
    if (description && description.length > 200) {
      return res.status(400).json({ error: 'Description must be less than 200 characters' });
    }
    
    // Validate permissions array if provided
    if (permissions && !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    
    // Create the role
    const roleStmt = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
    const roleResult = roleStmt.run(name.trim(), description ? description.trim() : null);
    const roleId = roleResult.lastInsertRowid as number;
    
    // Assign permissions to the role if provided
    if (permissions && permissions.length > 0) {
      // Get permission IDs for the provided permissions
      const permissionIds: number[] = [];
      for (const perm of permissions) {
        if (!perm.task_name || !perm.action) {
          continue;
        }
        
        const permStmt = db.prepare('SELECT id FROM permissions WHERE task_name = ? AND action = ?');
        const permission = permStmt.get(perm.task_name, perm.action) as { id: number } | undefined;
        
        if (permission) {
          permissionIds.push(permission.id);
        }
      }
      
      // Assign permissions to the role
      if (permissionIds.length > 0) {
        const rolePermStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
        for (const permissionId of permissionIds) {
          rolePermStmt.run(roleId, permissionId);
        }
      }
    }
    
    res.status(201).json({ 
      id: roleId, 
      name: name.trim(), 
      description: description ? description.trim() : null,
      message: 'Role created successfully' 
    });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A role with this name already exists' });
    }
    console.error('Failed to create role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /api/admin/roles/:id - Update a role
app.put('/api/admin/roles/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const roleId = parseInt(req.params.id);
    const { name, description, permissions } = req.body;
    
    // Validate ID
    if (isNaN(roleId) || roleId <= 0) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Validate name length
    if (name.length > 50) {
      return res.status(400).json({ error: 'Role name must be less than 50 characters' });
    }
    
    // Validate description length
    if (description && description.length > 200) {
      return res.status(400).json({ error: 'Description must be less than 200 characters' });
    }
    
    // Validate permissions array if provided
    if (permissions && !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    
    // Update the role
    const roleStmt = db.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?');
    const roleResult = roleStmt.run(name.trim(), description ? description.trim() : null, roleId);
    
    if (roleResult.changes === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Update permissions for the role if provided
    if (permissions) {
      // First, remove all existing permissions for this role
      const deleteRolePermsStmt = db.prepare('DELETE FROM role_permissions WHERE role_id = ?');
      deleteRolePermsStmt.run(roleId);
      
      // Then assign new permissions if provided
      if (permissions.length > 0) {
        // Get permission IDs for the provided permissions
        const permissionIds: number[] = [];
        for (const perm of permissions) {
          if (!perm.task_name || !perm.action) {
            continue;
          }
          
          const permStmt = db.prepare('SELECT id FROM permissions WHERE task_name = ? AND action = ?');
          const permission = permStmt.get(perm.task_name, perm.action) as { id: number } | undefined;
          
          if (permission) {
            permissionIds.push(permission.id);
          }
        }
        
        // Assign permissions to the role
        if (permissionIds.length > 0) {
          const rolePermStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
          for (const permissionId of permissionIds) {
            rolePermStmt.run(roleId, permissionId);
          }
        }
      }
    }
    
    res.json({ 
      id: roleId, 
      name: name.trim(), 
      description: description ? description.trim() : null,
      message: 'Role updated successfully' 
    });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A role with this name already exists' });
    }
    console.error('Failed to update role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/admin/roles/:id - Delete a role
app.delete('/api/admin/roles/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const roleId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(roleId) || roleId <= 0) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }
    
    // Check if user has administration delete permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'delete'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'delete'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Prevent deletion of roles that are assigned to users
    const userRoleStmt = db.prepare('SELECT 1 FROM user_roles WHERE role_id = ? LIMIT 1');
    const roleAssigned = userRoleStmt.get(roleId);
    
    if (roleAssigned) {
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }
    
    // Delete the role
    const roleStmt = db.prepare('DELETE FROM roles WHERE id = ?');
    const result = roleStmt.run(roleId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Failed to delete role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// GET /api/admin/permissions - Get all permissions
app.get('/api/admin/permissions', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Check if user has administration read permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'read'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Get all permissions grouped by task_name
    const stmt = db.prepare('SELECT * FROM permissions ORDER BY task_name, action');
    const permissions = stmt.all() as { id: number; task_name: string; action: string; description: string }[];
    
    res.json(permissions);
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// POST /api/admin/users/:id/roles - Assign roles to a user
app.post('/api/admin/users/:id/roles', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = parseInt(req.params.id);
    const { roleIds } = req.body;
    
    // Validate ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Validate roleIds array
    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ error: 'Role IDs must be an array' });
    }
    
    // Validate that all role IDs are numbers
    for (const roleId of roleIds) {
      if (isNaN(parseInt(roleId)) || parseInt(roleId) <= 0) {
        return res.status(400).json({ error: 'Invalid role ID provided' });
      }
    }
    
    // Check if user exists
    const userStmt = db.prepare('SELECT id FROM users WHERE id = ?');
    const user = userStmt.get(targetUserId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if all roles exist
    for (const roleId of roleIds) {
      const roleStmt = db.prepare('SELECT id FROM roles WHERE id = ?');
      const role = roleStmt.get(parseInt(roleId));
      
      if (!role) {
        return res.status(400).json({ error: `Role with ID ${roleId} not found` });
      }
    }
    
    // Remove existing roles for this user
    const deleteUserRolesStmt = db.prepare('DELETE FROM user_roles WHERE user_id = ?');
    deleteUserRolesStmt.run(targetUserId);
    
    // Assign new roles to the user
    if (roleIds.length > 0) {
      const userRoleStmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const roleId of roleIds) {
        userRoleStmt.run(targetUserId, parseInt(roleId));
      }
    }
    
    res.json({ message: 'User roles updated successfully' });
  } catch (error) {
    console.error('Failed to assign roles to user:', error);
    res.status(500).json({ error: 'Failed to assign roles to user' });
  }
});

// POST /api/admin/users/:id/permissions - Assign direct permissions to a user
app.post('/api/admin/users/:id/permissions', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = parseInt(req.params.id);
    const { permissions } = req.body;
    
    // Validate ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Validate permissions array
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    
    // Validate that all permissions have task_name and action
    for (const perm of permissions) {
      if (!perm.task_name || !perm.action) {
        return res.status(400).json({ error: 'Each permission must have task_name and action' });
      }
    }
    
    // Check if user exists
    const userStmt = db.prepare('SELECT id FROM users WHERE id = ?');
    const user = userStmt.get(targetUserId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove existing direct permissions for this user
    const deleteUserPermissionsStmt = db.prepare('DELETE FROM user_permissions WHERE user_id = ?');
    deleteUserPermissionsStmt.run(targetUserId);
    
    // Assign new permissions to the user
    if (permissions.length > 0) {
      // Get permission IDs for the provided permissions
      const permissionIds: number[] = [];
      for (const perm of permissions) {
        const permStmt = db.prepare('SELECT id FROM permissions WHERE task_name = ? AND action = ?');
        const permission = permStmt.get(perm.task_name, perm.action) as { id: number } | undefined;
        
        if (permission) {
          permissionIds.push(permission.id);
        }
      }
      
      // Assign permissions to the user
      if (permissionIds.length > 0) {
        const userPermStmt = db.prepare('INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)');
        for (const permissionId of permissionIds) {
          userPermStmt.run(targetUserId, permissionId);
        }
      }
    }
    
    res.json({ message: 'User permissions updated successfully' });
  } catch (error) {
    console.error('Failed to assign permissions to user:', error);
    res.status(500).json({ error: 'Failed to assign permissions to user' });
  }
});

// PUT /api/admin/users/:id/reset-2fa - Reset user 2FA
app.put('/api/admin/users/:id/reset-2fa', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Check if user has administration write permission
    const permissionStmt = db.prepare(`
      SELECT 1 FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
      UNION
      SELECT 1 FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.id = ? AND p.task_name = 'administration' AND p.action = 'write'
    `);
    
    const hasPermission = permissionStmt.get(userId, userId);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Reset 2FA by clearing phone number and disabling 2FA
    const stmt = db.prepare('UPDATE users SET phone_number = NULL, is_2fa_enabled = 0 WHERE id = ?');
    const result = stmt.run(targetUserId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also delete any existing 2FA codes
    const deleteCodesStmt = db.prepare('DELETE FROM user_2fa_codes WHERE user_id = ?');
    deleteCodesStmt.run(targetUserId);
    
    res.json({ message: '2FA reset successfully' });
  } catch (error) {
    console.error('Failed to reset 2FA:', error);
    res.status(500).json({ error: 'Failed to reset 2FA' });
  }
});

// POST /api/test-executions/:id/upload-file - Upload file for test execution
app.post('/api/test-executions/:id/upload-file', authenticateToken, upload.single('file'), (req, res) => {
try {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Save file info to database
  const stmt = db.prepare(`
    INSERT INTO test_execution_files (test_execution_id, file_name, file_path)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, req.file.originalname, req.file.path);

  res.json({ message: 'File uploaded successfully', file: req.file });
} catch (error) {
  res.status(500).json({ error: 'Failed to upload file' });
}
});

// GET /api/test-executions/:id/files - Get files for a test execution
app.get('/api/test-executions/:id/files', authenticateToken, (req, res) => {
try {
  const { id } = req.params;
  const stmt = db.prepare('SELECT * FROM test_execution_files WHERE test_execution_id = ?');
  const files = stmt.all(id);
  res.json(files);
} catch (error) {
  res.status(500).json({ error: 'Failed to fetch files' });
}
});

// PUT /api/test-executions/:id - Update individual test execution status and results
app.put('/api/test-executions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status, result_notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'in_progress', 'passed', 'failed', 'not_tested'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}` });
    }

    // Update test execution record
    const stmt = db.prepare(`
      UPDATE test_executions
      SET status = ?, result_notes = ?, executed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(status, result_notes, id);

    // Update test status
    const getTestStmt = db.prepare('SELECT test_id FROM test_executions WHERE id = ?');
    const execution = getTestStmt.get(id) as { test_id: number };

    if (execution) {
      const updateTestStmt = db.prepare('UPDATE tests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const testResult = updateTestStmt.run(status, execution.test_id);
    }

    res.json({ message: 'Test execution updated' });
  } catch (error) {
    console.error('Failed to update test execution:', error);
    res.status(500).json({ error: 'Failed to update test execution' });
  }
  
  // Check if all tests in the suite execution have been completed
  try {
    const getSuiteExecutionStmt = db.prepare(`
      SELECT se.id, se.suite_id
      FROM suite_executions se
      JOIN test_executions te ON se.id = te.suite_execution_id
      WHERE te.id = ?
    `);
    const suiteExecution = getSuiteExecutionStmt.get(req.params.id) as { id: number; suite_id: number } | undefined;
    
    if (suiteExecution) {
      // Check if all test executions for this suite execution are completed
      const checkAllCompletedStmt = db.prepare(`
        SELECT COUNT(*) as pending_count
        FROM test_executions
        WHERE suite_execution_id = ? AND status IN ('pending', 'not_tested')
      `);
      const result = checkAllCompletedStmt.get(suiteExecution.id) as { pending_count: number };
      
      // If no pending tests, mark suite execution as completed
      if (result.pending_count === 0) {
        const completeSuiteStmt = db.prepare(`
          UPDATE suite_executions
          SET status = 'completed', completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        completeSuiteStmt.run(suiteExecution.id);
      }
    }
  } catch (error) {
    console.error('Failed to check suite completion:', error);
  }
});

// POST /api/suite-executions/:id/complete - Complete a suite execution
app.post('/api/suite-executions/:id/complete', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Update suite execution to completed
    const stmt = db.prepare(`
      UPDATE suite_executions
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);

    res.json({ message: 'Suite execution completed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete suite execution' });
  }
});

// DELETE /api/test-executions/:id - Delete a test execution
app.delete('/api/test-executions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the test execution
    const stmt = db.prepare('DELETE FROM test_executions WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Test execution not found' });
    }
    
    res.json({ message: 'Test execution deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test execution' });
  }
});

// GET /api/test-suites/:id/executions - Get execution history for a test suite
app.get('/api/test-suites/:id/executions', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT se.*, COUNT(te.id) as total_tests, COUNT(CASE WHEN te.status = 'passed' THEN 1 END) as passed_tests,
             a.name as application_name, v.version_number as version_name
      FROM suite_executions se
      LEFT JOIN test_executions te ON se.id = te.suite_execution_id
      LEFT JOIN applications a ON se.application_id = a.id
      LEFT JOIN versions v ON se.version_id = v.id
      WHERE se.suite_id = ?
      GROUP BY se.id, a.name, v.version_number
      ORDER BY se.started_at DESC
    `);
    const executions = stmt.all(id) as any[];

    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suite executions' });
  }
});

// GET /api/suite-executions/:id/tests - Get all test executions for a suite execution
app.get('/api/suite-executions/:id/tests', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT te.*, t.short_name, t.area, t.manual_tasks, t.expected_results, t.is_mandatory,
             se.application_name, se.application_version
      FROM test_executions te
      JOIN tests t ON te.test_id = t.id
      JOIN suite_executions se ON te.suite_execution_id = se.id
      WHERE te.suite_execution_id = ?
      ORDER BY t.short_name
    `);
    const testExecutions = stmt.all(id) as any[];

    res.json(testExecutions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test executions' });
  }
});

// GET /api/suite-executions/:id - Get suite execution details
app.get('/api/suite-executions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT se.*, a.name as application_name, v.version_number as version_name
      FROM suite_executions se
      LEFT JOIN applications a ON se.application_id = a.id
      LEFT JOIN versions v ON se.version_id = v.id
      WHERE se.id = ?
    `);
    const execution = stmt.get(id);
    if (!execution) {
      return res.status(404).json({ error: 'Suite execution not found' });
    }
    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suite execution' });
  }
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, real_name, email } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password_hash, real_name, email, phone_number, is_2fa_enabled) VALUES (?, ?, ?, ?, NULL, 0)');
    stmt.run(username, hash, real_name || null, email || null);
    res.json({ message: 'User registered' });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as { id: number; username: string; password_hash: string } | undefined;
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret_key');
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Initialize the database
ensureDatabaseInitialized();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});