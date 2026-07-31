import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  modulePathIgnorePatterns: ['<rootDir>/frontend/.next/'],
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setup-e2e-env.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  maxWorkers: 1,
};

export default config;
