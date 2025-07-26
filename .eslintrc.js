module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    webextensions: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  rules: {
    // Allow console for development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Semicolons are optional in Standard
    'semi': ['error', 'always'],
    
    // Allow unused vars with underscore prefix
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    
    // Space before function parentheses
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }]
  },
  globals: {
    browser: 'readonly'
  }
};