/**
 * Jest configuration for Safari E2E tests
 * Uses Safari WebDriver for automated testing
 */

module.exports = {
  // Use Node environment for Safari WebDriver
  testEnvironment: 'node',
  
  // Safari E2E test files
  testMatch: [
    '<rootDir>/tests/e2e/safari*.test.js'
  ],
  
  // Setup files for Safari testing
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.safari.setup.js'
  ],
  
  // Longer timeout for Safari automation
  testTimeout: 60000,
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/Shared (Extension)/Resources/$1'
  },
  
  // Transform files with Babel
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Global variables for Safari testing
  globals: {
    SAFARI_HEADLESS: process.env.SAFARI_HEADLESS === 'true',
    SAFARI_TECH_PREVIEW: process.env.SAFARI_TECH_PREVIEW === 'true'
  }
};