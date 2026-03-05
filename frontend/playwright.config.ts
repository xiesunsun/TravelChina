import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'bash ../scripts/start-backend-e2e.sh',
      url: 'http://127.0.0.1:8000/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1 npm run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
