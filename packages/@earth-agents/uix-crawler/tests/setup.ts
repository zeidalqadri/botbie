// Test setup file
import { jest } from '@jest/globals';

// Mock external dependencies that might not be available in test environment
jest.setTimeout(30000); // 30 second timeout for integration tests

// Mock playwright to avoid launching actual browsers in tests
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newContext: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          goto: jest.fn(),
          $: jest.fn(),
          $$: jest.fn().mockResolvedValue([]),
          evaluate: jest.fn(),
          screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
          close: jest.fn(),
          waitForSelector: jest.fn(),
          waitForTimeout: jest.fn()
        })
      }),
      close: jest.fn()
    })
  }
}));

// Mock @earth-agents/core Logger
jest.mock('@earth-agents/core', () => ({
  Logger: class MockLogger {
    constructor(public name: string) {}
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
    debug = jest.fn();
  }
}));

// Mock file system for tests
global.beforeEach(() => {
  jest.clearAllMocks();
});