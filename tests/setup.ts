// Global test setup
import { jest } from '@jest/globals';

// Mock console to reduce noise in tests
global.console = {
  ...console,
  // Keep console.error and console.warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);