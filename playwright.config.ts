import { defineConfig } from '@playwright/test';

/**
 * The smoke test: every booth and attraction in a real browser, inside its
 * real sandbox, against the built site. `npm run smoke` runs it. CI installs
 * Chromium for it; locally, `npx playwright install chromium` once, or set
 * PLAYWRIGHT_CHANNEL=chrome to use the Chrome you have.
 */
export default defineConfig({
  testDir: 'smoke',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 1200, height: 1000 },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
