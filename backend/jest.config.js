module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Unit tests only. Integration tests need a live database and are run
  // separately via jest.integration.config.js, so a plain `npm test` stays
  // fast and runnable with no infrastructure.
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Set to just below current actual coverage so the gate blocks REGRESSION
  // today rather than failing every build on an aspirational number that has
  // never been met. Ratchet these up as controller and E2E tests land; the
  // target is 70% (see SIX_MONTH_PLAN.md, Month 6).
  coverageThreshold: {
    global: {
      branches: 17,
      functions: 16,
      lines: 18,
      statements: 19,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
};
