# Test Suite Management Application

A comprehensive web application for managing and executing test suites using TypeScript, React, and SQLite.

## Features

- Database: SQLite with TestSuites and Tests tables
- Frontend: React with Material-UI
- Backend: Express.js with JWT authentication
- CRUD operations for test suites and tests
- Bulk operations for running suites
- Export to CSV and PDF

## Setup Instructions

1. Clone the repository.

2. Install dependencies:
   - Root: npm install (if any)
   - Client: cd client && npm install
   - Server: cd server && npm install

3. For server, add ts-node: cd server && npm install ts-node --save-dev

4. Update server/package.json scripts:
   ```
   "scripts": {
     "dev": "ts-node server.ts",
     "build": "tsc",
     "start": "node dist/server.js"
   }
   ```

5. Run the server: cd server && npm run dev

6. Run the client: cd client && npm run dev

7. Open http://localhost:5173

## API Endpoints

- GET /api/test-suites
- POST /api/test-suites
- PUT /api/test-suites/:id
- DELETE /api/test-suites/:id
- GET /api/test-suites/:suiteId/tests
- POST /api/test-suites/:suiteId/tests
- PUT /api/tests/:id
- DELETE /api/tests/:id
- POST /api/test-suites/:id/run
- POST /api/auth/register
- POST /api/auth/login