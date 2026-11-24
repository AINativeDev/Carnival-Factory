import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
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

// Squares a maintainer switched off show "Closed for repairs" and never open a
// frame, so there's nothing of theirs to play.
const disabled = JSON.parse(readFileSync(join(root, 'northpole/disabled.json'), 'utf8')) as {
  booths: string[];
  attractions: string[];
};
const squares = (['booth', 'attraction'] as const).flatMap((kind) => {
  const dir = join(root, `${kind}s`);
  const off = new Set(disabled[`${kind}s`].map((id) => id.toLowerCase()));
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory() && !off.has(name))
    .map((id) => ({ kind, id }));
});

/** A square's frame: booths and attractions may share an id, so match both. */
const frameOf = (page: Page, kind: string, id: string) =>
  page.locator(`iframe[data-kind="${kind}"][data-id="${id}"]`);

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
    const frame = frameOf(page, kind, id);
    await expect(frame).toHaveAttribute('data-state', 'ready', { timeout: 5000 });
    await page.waitForTimeout(PLAY_MS);
    await expect(frame).toHaveAttribute('data-state', 'ready');
    // The slowest frame after warming up, not just the last one.
    const slowest = Number(await frame.getAttribute('data-slowest-draw-ms'));
    expect(slowest, 'a frame took too long to draw').toBeLessThanOrEqual(FRAME_BUDGET_MS);
    await page.locator('canvas').screenshot({ path: join(SHOTS, `${kind}-${id}.png`) });
    expect(problems).toEqual([]);
  });
}

test('the map opens the squares in view and stays quiet', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  // The town only draws, and so only opens, the squares in view: each one's
  // own test above opens it on its own page.
  await expect(page.locator('iframe[data-kind]').first()).toBeAttached({ timeout: 5000 });
  await page.waitForTimeout(3000);
  const states = await page
    .locator('iframe[data-kind]')
    .evaluateAll((frames) =>
      frames.map(
        (f) =>
          `${(f as HTMLElement).dataset.kind} ${(f as HTMLElement).dataset.id}: ${(f as HTMLElement).dataset.state}`,
      ),
    );
  expect(states.filter((state) => !state.endsWith(': ready'))).toEqual([]);
  await page
    .locator('canvas')
    .first()
    .screenshot({ path: join(SHOTS, 'map.png') });
  expect(problems).toEqual([]);
});

test("a square's sandbox keeps it from the network, storage and the page", async ({ page }) => {
  await page.goto('#/booth/jedi4ever');
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
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

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1200, height: 1000 },
]) {
  for (const { kind, id } of squares) {
    test(`#/?${kind}=${id} opens the map on it at ${viewport.width} wide`, async ({ page }) => {
      const problems = watch(page);
      await page.setViewportSize(viewport);
      await page.goto(`#/?${kind}=${id}`);
      // The town only opens the squares it has in view.
      await expect(frameOf(page, kind, id)).toHaveAttribute('data-state', 'ready', {
        timeout: 5000,
      });
      await expect(page.locator('.map-note')).toBeHidden();
      expect(problems).toEqual([]);
    });
  }
}

test('a deep link to a booth nobody has built says so, as text', async ({ page }) => {
  await page.goto('#/?booth=nobody-here-yet');
  await expect(page.locator('.map-note')).toHaveText(
    "There's no booth for @nobody-here-yet yet. Claim it!",
  );
  await expect(page.locator('.map-note a')).toHaveAttribute('href', /01-your-booth/);
  await page.goto('#/?booth=%3Cb%3Ehi%3C%2Fb%3E');
  await expect(page.locator('.map-note')).toBeHidden();
  await expect(page.locator('.map-note b')).toHaveCount(0);
});

test("a square's page shares its deep link", async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('#/booth/jedi4ever');
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe('http://localhost:4173/#/?booth=jedi4ever');
  await page.getByRole('link', { name: 'See it on the map' }).click();
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(page.locator('.map-canvas')).toBeVisible();
});
