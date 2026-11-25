/**
 * The smoke tests' `test`, which also records what the page's own code ran
 * when COVERAGE=1, in Chromium, for scripts/e2e-coverage/report.ts to count
 * (docs/adr/0032-browser-coverage-counts.md). Every spec imports `test` and
 * `expect` from here, so no test is left out of the count.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test as base } from '@playwright/test';

export { expect, type Page } from '@playwright/test';

const OUT = join(import.meta.dirname, '..', 'coverage-browser');

export const test = base.extend<{ recordCoverage: undefined }>({
  recordCoverage: [
    async ({ page, browserName }, use, testInfo) => {
      const on = process.env.COVERAGE === '1' && browserName === 'chromium';
      if (on) await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use(undefined);
      if (!on) return;
      // Only the page's own built scripts: never a square's frame or anything else.
      const scripts = (await page.coverage.stopJSCoverage()).filter(
        (entry) => /\/assets\/[^/]+\.js$/.test(new URL(entry.url).pathname) && entry.source,
      );
      mkdirSync(OUT, { recursive: true });
      writeFileSync(join(OUT, `${testInfo.testId}.json`), JSON.stringify(scripts));
    },
    { auto: true },
  ],
});
