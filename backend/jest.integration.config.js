/**
 * Integration tests: these boot the real AppModule and talk to a real
 * PostgreSQL database, so they are kept out of the default `npm test` run.
 * Requires DATABASE_URL to point at a migrated test database.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testTimeout: 30000,
  // Integration specs share one database; running them in parallel makes them
  // fight over the same rows.
  maxWorkers: 1,
  verbose: true,
};
