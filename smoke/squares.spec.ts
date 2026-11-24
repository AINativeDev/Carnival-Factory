import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/**
 * Plays every booth and attraction for a few seconds in its sandboxed frame,
 * and fails on anything a square shouldn't do: console errors, uncaught
 * exceptions, requests anywhere but the site itself, never opening, or frames
 * slower than the budget. Saves a screenshot of each, and of the map, to
 * screenshots/ for the pull request's preview comment.
 */

const root = join(import.meta.dirname, '..');
const SHOTS = join(root, 'screenshots');
/** Milliseconds a square may spend drawing one frame. */
const FRAME_BUDGET_MS = 8;
const PLAY_MS = 3000;

const squares = (['booth', 'attraction'] as const).flatMap((kind) => {
  const dir = join(root, `${kind}s`);
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .map((id) => ({ kind, id }));
});

/** Collects what the page and every frame in it did wrong. */
function watch(page: Page) {
  const problems: string[] = [];
  const site = new URL('http://localhost:4173/');
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.origin !== site.origin) problems.push(`request to ${request.url()}`);
  });
  return problems;
}

mkdirSync(SHOTS, { recursive: true });

for (const { kind, id } of squares) {
  test(`${kind} ${id} opens, draws within budget and stays quiet`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`#/${kind}/${id}`);
    const frame = page.locator(`iframe[data-id="${id}"]`);
    await expect(frame).toHaveAttribute('data-state', 'ready', { timeout: 5000 });
    await page.waitForTimeout(PLAY_MS);
    await expect(frame).toHaveAttribute('data-state', 'ready');
    const drawMs = Number(await frame.getAttribute('data-draw-ms'));
    expect(drawMs, 'last frame took too long to draw').toBeLessThanOrEqual(FRAME_BUDGET_MS);
    await page.locator('canvas').screenshot({ path: join(SHOTS, `${kind}-${id}.png`) });
    expect(problems).toEqual([]);
  });
}

test('the map opens every square and stays quiet', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  for (const { id } of squares) {
    await expect(page.locator(`iframe[data-id="${id}"]`)).toHaveAttribute('data-state', 'ready', {
      timeout: 5000,
    });
  }
  await page.waitForTimeout(1000);
  await page.locator('canvas').screenshot({ path: join(SHOTS, 'map.png') });
  expect(problems).toEqual([]);
});

test("a square's sandbox keeps it from the network, storage and the page", async ({ page }) => {
  await page.goto('#/booth/jedi4ever');
  await expect(page.locator('iframe[data-id="jedi4ever"]')).toHaveAttribute('data-state', 'ready');
  const frame = page.frames().find((f) => f.url().includes('square.html#booth/jedi4ever'))!;
  const walls = await frame.evaluate(async () => {
    const blocked = async (attempt: () => unknown) => {
      try {
        await attempt();
        return false;
      } catch {
        return true;
      }
    };
    return {
      fetch: await blocked(() => fetch('https://example.com')),
      sameSiteFetch: await blocked(() => fetch('/')),
      localStorage: await blocked(() => localStorage.getItem('x')),
      cookie: await blocked(() => document.cookie),
      parentPage: await blocked(() => parent.document.title),
      // A blocked worker isn't refused when it's made, it just never runs.
      worker: await new Promise<boolean>((resolve) => {
        try {
          const worker = new Worker('data:text/javascript,postMessage(1)');
          worker.onmessage = () => resolve(false);
          worker.onerror = () => resolve(true);
          setTimeout(() => resolve(true), 1000);
        } catch {
          resolve(true);
        }
      }),
      popup: window.open('https://example.com') === null,
      // The square's own code runs in a blob: worker like this one, which keeps
      // the frame's policy, so it can't reach the network either.
      workerFetch: await new Promise<boolean>((resolve) => {
        const code = `fetch('https://example.com').then(() => postMessage(false), () => postMessage(true))`;
        const worker = new Worker(URL.createObjectURL(new Blob([code])));
        worker.onmessage = (event) => resolve(event.data as boolean);
        worker.onerror = () => resolve(true);
        setTimeout(() => resolve(true), 2000);
      }),
    };
  });
  expect(walls).toEqual({
    fetch: true,
    sameSiteFetch: true,
    localStorage: true,
    cookie: true,
    parentPage: true,
    worker: true,
    popup: true,
    workerFetch: true,
  });
});
