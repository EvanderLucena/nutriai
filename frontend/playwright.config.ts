import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'authenticated',
      testMatch:
        /patient-management|food-catalog|meal-plans|biometry-dashboard|numeric-normalization/,
      dependencies: ['setup'],
      use: {
        storageState: 'e2e/.auth/user.json',
      },
    },
    {
      name: 'ui-integration',
      testMatch: /ui-integration|patient-tabs|journey/,
      dependencies: ['setup'],
      use: {
        storageState: undefined,
      },
    },
    {
      name: 'public',
      testMatch: /auth\.spec\.ts/,
    },
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'cd ../backend && ./gradlew bootRun --args="--spring.profiles.active=dev"',
      url: 'http://localhost:8080/api/v1/health',
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        NUTRIAI_JWT_SECRET: 'e2e-test-secret-do-not-use-in-production',
        NUTRIAI_SEED_ADMIN_PASSWORD: 'e2e-seed-password',
      },
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
      cwd: '.',
    },
  ],
});
