/**
 * Jest configuration for E2E tests
 * Uses Node environment instead of jsdom for Puppeteer compatibility
 */

module.exports = {
  // Use Node environment for Puppeteer
  testEnvironment: 'node',
  
  // E2E test files only
  testMatch: [
    '<rootDir>/tests/e2e/**/*.test.js'
  ],
  
  // Setup files specific to E2E
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.e2e.setup.js'
  ],
  
  // Longer timeout for E2E tests
  testTimeout: 30000,
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/Shared (Extension)/Resources/$1'
  },
  
  // Transform files with Babel
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Global variables available in tests
  globals: {
    HEADLESS: process.env.HEADLESS === 'true',
    SLOWMO: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
    DEVTOOLS: process.env.DEVTOOLS === 'true'
  }
};