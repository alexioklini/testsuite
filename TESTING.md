# Testing Setup für TestSuite Repository

## Dateien zum Hinzufügen in Ihr Repository

### 1. Root-Verzeichnis: `/TESTING.md`

```markdown
# Testing Strategy für TestSuite

Dieses Dokument beschreibt die Test-Strategie und -Architektur für das TestSuite-Projekt.

## Test-Pyramide
```

```
    /\
   /E2E\      <- Playwright (User Journeys)
  /------\
 /Integration\ <- Jest + Supertest (API & DB)
/------------\
```

/  Unit Tests  \ <- Jest + RTL (Components & Functions)
/––––––––\

```
## Quick Start

### Alle Tests ausführen
```bash
npm run test:all
```

### Spezifische Test-Typen

```bash
npm run test:unit        # Unit Tests
npm run test:integration # Integration Tests  
npm run test:e2e        # End-to-End Tests
```

### Mit Coverage

```bash
npm run test:coverage
```

## Test-Struktur

- **Unit Tests**: In `__tests__` Ordnern neben dem Code
- **Integration Tests**: In `/tests/integration`
- **E2E Tests**: In `/e2e` Verzeichnis

## Claude Code Integration

Tests können automatisch mit Claude Code generiert werden:

```bash
# Unit Test generieren
claude-code "Erstelle Unit Tests für server/src/controllers/auth.controller.ts"

# E2E Test aus User Story
claude-code "Erstelle E2E Test: Benutzer erstellt neue Test Suite"
```

Siehe [Vollständige Dokumentation](./docs/TESTING_GUIDE.md) für Details.

```
### 2. Server Package.json Updates: `/server/package.json`
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "sqlite3": "^5.1.6",
    "@types/sqlite3": "^3.1.8"
  }
}
```

### 3. Client Package.json Updates: `/client/package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "msw": "^2.0.0",
    "ts-jest": "^29.1.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### 4. Jest Config Server: `/server/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/server.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 5. Jest Config Client: `/client/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.tsx?',
    '**/*.test.tsx?',
    '**/*.spec.tsx?'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  }
};
```

### 6. Playwright Config: `/e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: [
    {
      command: 'cd ../server && npm run dev',
      port: 5000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../client && npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
```

### 7. Test Setup Server: `/server/tests/setup.ts`

```typescript
import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db: any;

beforeAll(async () => {
  // Setup test database
  db = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS TestSuites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suiteId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      expectedResult TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (suiteId) REFERENCES TestSuites(id)
    );

    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

afterAll(async () => {
  if (db) {
    await db.close();
  }
});

beforeEach(async () => {
  // Clear all data before each test
  await db.exec(`
    DELETE FROM Tests;
    DELETE FROM TestSuites;
    DELETE FROM Users;
  `);
});

// Export for use in tests
export { db };
```

### 8. Test Setup Client: `/client/src/tests/setupTests.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch if needed
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 9. Beispiel Unit Test: `/server/src/controllers/__tests__/auth.controller.test.ts`

```typescript
import { Request, Response } from 'express';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import { jest } from '@jest/globals';

jest.mock('../../services/auth.service');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    authController = new AuthController(mockAuthService);
    
    mockRequest = {
      body: {},
      params: {},
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };
      
      mockRequest.body = loginData;
      mockAuthService.validateUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
      
      mockAuthService.generateToken.mockReturnValue('mock-jwt-token');

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        user: expect.objectContaining({
          username: 'testuser'
        })
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = {
        username: 'wronguser',
        password: 'wrongpass'
      };
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });
  });
});
```

### 10. GitHub Actions Workflow: `/.github/workflows/test.yml`

```yaml
name: Test Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-server:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: server/package-lock.json
    
    - name: Install dependencies
      run: |
        cd server
        npm ci
    
    - name: Run tests
      run: |
        cd server
        npm run test:ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./server/coverage/lcov.info
        flags: server

  test-client:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: client/package-lock.json
    
    - name: Install dependencies
      run: |
        cd client
        npm ci
    
    - name: Run tests
      run: |
        cd client
        npm run test:ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./client/coverage/lcov.info
        flags: client

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        npm ci
        cd server && npm ci
        cd ../client && npm ci
        cd ../e2e && npm ci
        npx playwright install
    
    - name: Run E2E tests
      run: |
        cd e2e
        npm run test
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: e2e/playwright-report/
        retention-days: 30
```

### 11. Root Package.json Scripts: `/package.json`

```json
{
  "name": "testsuite",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "install:all": "npm install && cd server && npm install && cd ../client && npm install",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "test:all": "npm run test:server && npm run test:client && npm run test:e2e",
    "test:server": "cd server && npm test",
    "test:client": "cd client && npm test",
    "test:e2e": "cd e2e && npm test",
    "test:coverage": "npm run coverage:server && npm run coverage:client",
    "coverage:server": "cd server && npm run test:coverage",
    "coverage:client": "cd client && npm run test:coverage"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

## Anleitung zum Hinzufügen in GitHub

### Schritt 1: Lokale Vorbereitung

```bash
# In Ihrem lokalen Repository
git checkout -b feature/testing-framework
```

### Schritt 2: Dateien erstellen

Erstellen Sie die oben genannten Dateien in den entsprechenden Verzeichnissen.

### Schritt 3: Dependencies installieren

```bash
# Root
npm install

# Server
cd server
npm install --save-dev @types/jest @types/supertest jest supertest ts-jest sqlite3 @types/sqlite3

# Client  
cd ../client
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/jest jest jest-environment-jsdom msw ts-jest @playwright/test

# E2E
cd ..
mkdir e2e && cd e2e
npm init -y
npm install --save-dev @playwright/test typescript @types/node
```

### Schritt 4: Commit und Push

```bash
git add .
git commit -m "feat: Add comprehensive testing framework

- Add Jest configuration for unit and integration tests
- Add Playwright configuration for E2E tests
- Add test setup files and examples
- Add GitHub Actions workflow for CI/CD
- Add testing documentation"

git push origin feature/testing-framework
```

### Schritt 5: Pull Request erstellen

Erstellen Sie einen Pull Request auf GitHub mit der Beschreibung:

```markdown
## Testing Framework Implementation

This PR adds a comprehensive testing framework to the TestSuite project.

### Changes
- ✅ Jest setup for unit and integration tests
- ✅ Playwright setup for E2E tests
- ✅ Test configurations and helper files
- ✅ Example tests as templates
- ✅ GitHub Actions CI/CD pipeline
- ✅ Testing documentation

### Test Coverage Goals
- Unit Tests: 80%
- Integration Tests: 70%
- E2E Tests: Critical user journeys

### How to Test
1. Run `npm run install:all` to install dependencies
2. Run `npm run test:all` to execute all tests
3. Run `npm run test:coverage` to see coverage reports

### Next Steps
- [ ] Add more unit tests for existing components
- [ ] Implement integration tests for all API endpoints
- [ ] Create E2E tests for main user workflows
```

## Claude Code Integration für Test-Generierung

Nach dem Setup können Sie Claude Code wie folgt nutzen:

```bash
# Beispiel 1: Unit Test für eine Komponente generieren
claude-code "Analysiere client/src/components/TestSuiteList.tsx und erstelle vollständige Unit Tests mit React Testing Library"

# Beispiel 2: API Integration Test generieren
claude-code "Erstelle Integration Tests für die TestSuite API Endpoints in server/routes/testSuites.ts"

# Beispiel 3: E2E Test aus User Story
claude-code "Erstelle einen Playwright E2E Test für folgende User Story: Als Benutzer möchte ich mich einloggen, eine neue Test Suite erstellen, Tests hinzufügen und die Suite ausführen"
```
