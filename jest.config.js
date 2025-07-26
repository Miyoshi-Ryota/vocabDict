module.exports = {
  testEnvironment: 'jsdom',
  
  // Where to look for test files
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module name mapper for Safari extension APIs
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/Shared \\(Extension\\)/'
  ]
};