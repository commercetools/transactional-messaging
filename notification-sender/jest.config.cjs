module.exports = {
  displayName: 'notification-sender',
  testMatch: ['**/tests/**/*.spec.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup-tests.ts'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
};
