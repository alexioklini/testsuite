import { deleteAllTestData } from './test-helpers';

// Mock external dependencies
jest.mock('../server', () => {
  const originalModule = jest.requireActual('../server');
  
  // Mock the sendSMS function
  originalModule.sendSMS = jest.fn().mockResolvedValue(true);
  
  // Mock Date.now for consistent timestamps
  global.Date.now = jest.fn().mockReturnValue(new Date('2023-01-01T00:00:00Z').getTime());
  
  return originalModule;
});

// Delete all test data before each test
beforeEach(() => {
  deleteAllTestData();
});

// Delete all test data after each test
afterEach(() => {
  deleteAllTestData();
});