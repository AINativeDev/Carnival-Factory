import { defineConfig, devices } from '@playwright/test';

/**
 * The smoke test: every booth and attraction in a real browser, inside its
 * real sandbox, against the built site, plus a check in WebKit as an iPhone.
 * `npm run smoke` runs it. CI installs Chromium and WebKit for it; locally,
 * `npx playwright install chromium webkit` once, or set PLAYWRIGHT_CHANNEL=chrome
 * to use the Chrome you have.
 */
export default defineConfig({
  testDir: 'smoke',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /safari\.spec\.ts/,
      use: {
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        viewport: { width: 1200, height: 1000 },
      },
    },
    // Safari's engine, as an iPhone, for what only Safari does differently.
    { name: 'webkit', testMatch: /safari\.spec\.ts/, use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
