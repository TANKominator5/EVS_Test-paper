import { defineConfig, devices } from '@playwright/test';

const url = 'http://127.0.0.1:3170';

export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: url, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --hostname 127.0.0.1 --port 3170', url, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
