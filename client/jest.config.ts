import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Test file patterns
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  
  // Module path aliases (match tsconfig paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Use SWC for transformation (works better in CI)
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  
  // Coverage configuration - exclude shadcn UI components
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    // Exclude shadcn UI components - they are third-party
    '!components/ui/**',
    // Exclude type definitions
    '!**/*.d.ts',
    // Exclude config files
    '!**/*.config.{ts,tsx,js,mjs}',
  ],
  coverageDirectory: 'coverage',
  
  // Transform ignore patterns - allow better-auth to be transformed
  transformIgnorePatterns: [
    '/node_modules/(?!(better-auth)/)',
    '^.+\.module\.(css|sass|scss)$',
  ],
  
  verbose: true,
};

export default config;
