import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60 * 1000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev -- --host --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
