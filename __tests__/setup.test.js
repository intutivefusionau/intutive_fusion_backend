// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock logger to reduce noise in tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn(),
  },
}));

// Global test utilities
global.testHelpers = {
  // Add global test helper functions here
};

// Clean up after all tests
afterAll(async () => {
  // Close any open connections, clear mocks, etc.
  await new Promise((resolve) => setTimeout(resolve, 500));
});
