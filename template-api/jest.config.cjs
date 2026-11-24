module.exports = {
  displayName: 'template-api',
  testMatch: ['**/tests/**/*.spec.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup-tests.ts'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
};
