import { defineConfig, devices } from '@playwright/test';
import { BOOTH_ONLY_SPECS, boothOnly as playsOneBooth } from './scripts/smoke-scope.ts';

/**
 * The smoke test: every booth and attraction in a real browser, inside its
 * real sandbox, against the built site, plus a check in WebKit as an iPhone.
 * `npm run smoke` runs it. CI installs Chromium and WebKit for it; locally,
 * `npx playwright install chromium webkit` once, or set PLAYWRIGHT_CHANNEL=chrome
 * to use the Chrome you have.
 */
/** This browser has closed the intro before: what src/intro.ts keeps in storage. */
const INTRO_SEEN = {
  origin: 'http://localhost:4173',
  localStorage: [{ name: 'north-pole-intro-seen', value: '1' }],
};

/**
 * A pull request that only changes one booth's folder (scripts/smoke-scope.ts).
 * A level-only run still runs the whole suite, walking just that level.
 */
const boothOnly = playsOneBooth(process.env.SMOKE_ONLY);

export default defineConfig({
  testDir: 'smoke',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    // Every test but the intro's own starts with the first-visit intro seen,
    // so it never stands between a test and the map (docs/specs/intro.md).
    storageState: { cookies: [], origins: [INTRO_SEEN] },
  },
  projects: [
    {
      name: 'chromium',
      // A booth-only pull request (SMOKE_ONLY) runs just the specs that play its booth.
      ...(boothOnly ? { testMatch: BOOTH_ONLY_SPECS } : { testIgnore: /safari\.spec\.ts/ }),
      use: {
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        viewport: { width: 1200, height: 1000 },
      },
    },
    // Safari's engine, as an iPhone, for what only Safari does differently: the site's, not a booth's.
    ...(boothOnly
      ? []
      : [{ name: 'webkit', testMatch: /safari\.spec\.ts/, use: { ...devices['iPhone 13'] } }]),
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
