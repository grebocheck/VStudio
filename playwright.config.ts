import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
// Overridable so e2e can run against a fresh server while another instance occupies 3000.
const PORT = Number(process.env.PORT) || 3000;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // System Chrome: Playwright's bundled Chromium has no build for this OS (ubuntu 26.04).
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: isCI ? 'npm run start' : 'npm run dev',
    url: `http://127.0.0.1:${PORT}/healthz`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
