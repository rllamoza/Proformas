import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node ../back/dev-server.mjs',
      url: 'http://localhost:8080/api/v1/health',
      reuseExistingServer: true,
      timeout: 15000,
    },
    {
      command: 'npm.cmd run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 15000,
    },
  ],
});
