import { join } from 'node:path';
import { expect, test } from './coverage';
import { FRAME_BUDGET_MS, SHOTS, frameOf, played, present, watch } from './support/carnival';
import { stageOf } from './support/map-canvas';

/**
 * Plays every booth and attraction for a few seconds in its sandboxed frame,
 * and fails on anything a square shouldn't do: console errors, uncaught
 * exceptions, requests anywhere but the site itself, never opening, or frames
 * slower than the budget. Saves a screenshot of each, and of the map, to
 * screenshots/ for the pull request's preview comment. The sandbox's own walls
 * are checked here too, since they are what makes playing a square safe.
 */

const PLAY_MS = 3000;

for (const { kind, id } of played) {
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
    // The square's drawing, on the back wall of the room the player is inside.
    await expect(page.locator('.map-canvas')).toHaveAttribute('data-stage', /^\d+,\d+,\d+,\d+$/);
    const stage = await stageOf(page);
    await page.screenshot({
      path: join(SHOTS, `${kind}-${id}.png`),
      clip: { x: stage.x, y: stage.y, width: stage.w, height: stage.h },
    });
    expect(problems).toEqual([]);
  });
}

test('the map opens the squares in view and stays quiet', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  // The town only draws, and so only opens, the squares in view: each one's
  // own test above goes inside it.
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
  // The frame's address carries its build (square.html?v=<build>#booth/<login>).
  const frame = present(
    page.frames().find((f) => /square\.html(\?[^#]*)?#booth\/jedi4ever$/.test(f.url())),
    "the booth's sandboxed frame",
  );
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
          worker.onmessage = () => {
            resolve(false);
          };
          worker.onerror = () => {
            resolve(true);
          };
          setTimeout(() => {
            resolve(true);
          }, 1000);
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
        worker.onmessage = (event) => {
          resolve(event.data as boolean);
        };
        worker.onerror = () => {
          resolve(true);
        };
        setTimeout(() => {
          resolve(true);
        }, 2000);
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
