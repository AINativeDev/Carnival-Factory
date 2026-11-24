import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { CLAIM_URL } from '../northpole/links';
import { worldToScreen } from '../northpole/camera';
import { CLAIM_SIGN } from '../northpole/render';
import { buildWorld, toScreen, type PinnedPlots } from '../northpole/world';

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
/** Milliseconds the map may spend drawing one frame, on average, while the player walks. */
const MAP_FRAME_BUDGET_MS = 12;
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
    // The square's drawing, on the back wall of the room the player is inside.
    const map = page.locator('.map-canvas');
    await expect(map).toHaveAttribute('data-stage', /^\d+,\d+,\d+,\d+$/);
    const [x, y, w, h] = (await map.getAttribute('data-stage'))!.split(',').map(Number);
    const box = (await map.boundingBox())!;
    const ratio = await page.evaluate(() => Math.min(2, devicePixelRatio || 1));
    await page.screenshot({
      path: join(SHOTS, `${kind}-${id}.png`),
      clip: { x: box.x + x / ratio, y: box.y + y / ratio, width: w / ratio, height: h / ratio },
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
  // The frame's address carries the build it came from: square.html?v=<build>#booth/jedi4ever.
  const frame = page
    .frames()
    .find((f) => /square\.html(\?[^#]*)?#booth\/jedi4ever$/.test(f.url()))!;
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

test("Share copies a friendly line with the booth's share page, which unfurls and leads back", async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('#/booth/jedi4ever');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(
    /^@jedi4ever built .+ at the North Pole Carnival\. Come visit, and build your own: http:\/\/localhost:4173\/share\/booth-jedi4ever\.html$/,
  );
  // The owner can share it as theirs, and edit the line before copying.
  await page.getByRole('button', { name: 'share it as yours' }).click();
  await expect(page.getByLabel('Share text')).toHaveValue(/^I built /);

  const share = await request.get('share/booth-jedi4ever.html');
  const html = await share.text();
  expect(html).toContain('<meta property="og:title"');
  expect(html).toContain('<meta property="og:description"');
  expect(html).toContain('<meta property="og:image"');
  expect(html).toContain('<meta name="twitter:card"');
  expect(html).not.toMatch(/<script/i);
  await page.goto('share/booth-jedi4ever.html');
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  await expect(page.locator('.visit').and(page.getByRole('region', { name: /.+/ }))).toBeVisible();

  await page.getByRole('link', { name: 'See it on the map' }).click();
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(page.locator('.visit')).toHaveCount(0);
  await expect(page.locator('.map-canvas')).toBeVisible();
});

const booths = squares.filter((square) => square.kind === 'booth').map((square) => square.id);
const attractions = squares.filter((s) => s.kind === 'attraction').map((s) => s.id);
const pinned = JSON.parse(readFileSync(join(root, 'northpole/plots.json'), 'utf8')) as PinnedPlots;

test('the player walks the world with the keyboard, and it stays quiet', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  const { start } = buildWorld(attractions, booths, pinned);
  await expect(canvas).toHaveAttribute('data-player', `${start.x},${start.y}`);
  await canvas.focus();
  for (const key of ['ArrowRight', 'd', 'ArrowDown', 's']) {
    const before = await canvas.getAttribute('data-player');
    await page.keyboard.down(key);
    await page.waitForTimeout(400);
    await page.keyboard.up(key);
    await expect(canvas).not.toHaveAttribute('data-player', before!);
  }
  expect(problems).toEqual([]);
});

test('pressing E at a booth goes inside it, and Esc, Back or walking out leaves', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever');
  await expect(page.locator('.map-prompt')).toBeVisible();
  // Standing at the stall shows its tag.
  await expect(page.locator('.map-tag.shown')).toHaveAttribute('data-plot', 'booth:jedi4ever');
  const at = await canvas.getAttribute('data-player');
  await canvas.focus();
  await page.keyboard.press('e');
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  const card = page.locator('.visit');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading')).toBeFocused();
  await expect(card).toContainText('@jedi4ever');
  await expect(card).toContainText('Esc or walk out to leave');
  await expect(page.locator('.map-frame')).toHaveAttribute('data-visiting', 'booth:jedi4ever');
  // After the fade, the room is drawn, with the player just inside its doorway.
  await expect(canvas).toHaveAttribute('data-room', '0.50,0.85');
  await expect(page.locator('.hud-booths')).toBeHidden();
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  // A link to the map counts as a shared link: the invitation shows, once a visit.
  await expect(card.locator('.visit-invite')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(page.locator('.map-frame')).not.toHaveAttribute('data-visiting', /.*/);
  await expect(canvas).not.toHaveAttribute('data-room', /.*/);
  await expect(canvas).toHaveAttribute('data-player', at!);
  await expect(canvas).toBeFocused();

  // The back button leaves too, and so does walking out through the doorway.
  await page.keyboard.press('e');
  await expect(card).toBeVisible();
  await expect(card.locator('.visit-invite')).toBeHidden();
  await page.goBack();
  await expect(card).toHaveCount(0);
  await canvas.focus();
  await page.keyboard.press('e');
  await expect(card).toBeVisible();
  await expect(canvas).toHaveAttribute('data-room', /.*/);
  // Walking about inside stays inside.
  await page.keyboard.down('a');
  await page.waitForTimeout(400);
  await page.keyboard.up('a');
  await expect(card).toBeVisible();
  await expect(canvas).not.toHaveAttribute('data-room', '0.50,0.85');
  await page.keyboard.down('d');
  await page.waitForTimeout(400);
  await page.keyboard.up('d');
  await page.keyboard.down('s');
  await expect(card).toHaveCount(0);
  await page.keyboard.up('s');
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(canvas).toHaveAttribute('data-player', at!);
  expect(problems).toEqual([]);
});

test('a shared link starts inside the booth, and invites the visitor to claim the plot next door', async ({
  page,
  context,
}) => {
  const problems = watch(page);
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'claim form' }));
  await page.goto('#/booth/jedi4ever');
  const card = page.locator('.visit');
  await expect(card).toBeVisible();
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-room', '0.50,0.85');
  const invite = card.locator('.visit-invite');
  await expect(invite).toBeVisible();
  await expect(invite).toContainText('@jedi4ever built this by describing it in an issue');
  await expect(invite.getByRole('link', { name: 'How was this built?' })).toHaveAttribute(
    'href',
    /docs\/how-it-works\.md$/,
  );
  await invite.getByRole('button', { name: 'Claim the plot next door' }).click();
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', /^open:/, { timeout: 20_000 });
  const form = context.waitForEvent('page');
  await page.keyboard.press('e');
  expect((await form).url()).toBe(CLAIM_URL);
  // The invitation shows once a visit: opening the booth again doesn't nag.
  await page.locator('.hud-list button[data-kind="booth"][data-id="jedi4ever"]').click();
  await expect(card).toBeVisible();
  await expect(card.locator('.visit-invite')).toBeHidden();
  expect(problems).toEqual([]);
});

test('clicking an open plot opens the form to claim a booth', async ({ page, context }) => {
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'claim form' }));
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever');
  await page.waitForTimeout(500);
  // The map says where its camera is, so the open plot's sign is found from that.
  const world = buildWorld(attractions, booths, pinned);
  const open = world.plots.find((plot) => plot.kind === 'open')!;
  const [x, y, zoom] = (await canvas.getAttribute('data-camera'))!.split(',').map(Number);
  const sign = toScreen({ x: open.x + (open.w - 1) / 2, y: open.y + (open.h - 1) / 2 });
  const box = (await canvas.boundingBox())!;
  const board = { x: sign.x, y: sign.y - CLAIM_SIGN.post - CLAIM_SIGN.h / 2 };
  const at = worldToScreen(board, box.width, box.height, { x, y }, zoom);
  const form = context.waitForEvent('page');
  await canvas.click({ position: at });
  expect((await form).url()).toBe(CLAIM_URL);
});

test('the map shows the island, its HUD, and draws within budget while the player walks', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/');
  await expect(page.locator('.hud-tessl')).toHaveText('Built with Tessl');
  await expect(page.locator('.hud-controls kbd').first()).toBeVisible();
  const canvas = page.locator('.map-canvas');
  await canvas.focus();
  // Walk back and forth for a few seconds, so the camera comes in and the map times its frames.
  for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']) {
    await page.keyboard.down(key);
    await page.waitForTimeout(900);
    await page.keyboard.up(key);
  }
  // The map publishes its average only after warming up, so wait for a real measurement.
  await expect(canvas).toHaveAttribute('data-frame-ms', /^\d+(\.\d+)?$/);
  const average = Number(await canvas.getAttribute('data-frame-ms'));
  expect(average, 'the map took too long to draw its frames').toBeLessThanOrEqual(
    MAP_FRAME_BUDGET_MS,
  );
  expect(problems).toEqual([]);
});

test("shift-clicking a name in the Booths panel walks the player to a booth's door", async ({
  page,
}) => {
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await page
    .locator('.hud-list button[data-kind="booth"][data-id="jedi4ever"]')
    .click({ modifiers: ['Shift'] });
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 20_000 });
});

test('the Booths panel and Featured go straight to their square, and inside it', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await page.locator('.hud-list button[data-kind="booth"][data-id="jedi4ever"]').click();
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 1000 });
  await expect(page.locator('.visit[data-kind="booth"][data-id="jedi4ever"]')).toBeVisible();
  // Inside, the Booths panel steps aside, so leave first.
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/$/);
  const featured = page.locator('.hud-featured button[data-kind]');
  await expect(featured).toContainText('Featured');
  await featured.click();
  const id = await featured.getAttribute('data-id');
  await expect(canvas).toHaveAttribute('data-near', `attraction:${id}`, { timeout: 1000 });
  await expect(page).toHaveURL(new RegExp(`#/attraction/${id}$`));
  await expect(page.locator(`.visit[data-kind="attraction"][data-id="${id}"]`)).toBeVisible();
  await expect(page.locator('.visit')).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('Claim a plot walks the player to an open plot, where E opens the form', async ({
  page,
  context,
}) => {
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'claim form' }));
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await page.getByRole('button', { name: 'Claim a plot' }).click();
  await expect(canvas).toHaveAttribute('data-near', /^open:/, { timeout: 20_000 });
  await expect(page.locator('.map-prompt')).toHaveText('Press E to claim this plot');
  const form = context.waitForEvent('page');
  await page.keyboard.press('e');
  expect((await form).url()).toBe(CLAIM_URL);
});

test('the screen-reader guide shows itself when a link in it has keyboard focus', async ({
  page,
}) => {
  await page.goto('#/');
  const guide = page.locator('.map > .visually-hidden');
  expect((await guide.boundingBox())!.width).toBeLessThanOrEqual(1);
  await page.locator('.map > .visually-hidden a').first().focus();
  expect((await guide.boundingBox())!.width).toBeGreaterThan(100);
  await expect(page.getByRole('link', { name: 'claim your own' })).toBeInViewport();
});

for (const viewport of [
  { width: 1400, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`the map fits a ${viewport.width} by ${viewport.height} window with no scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('#/');
    await expect(page.locator('.map-canvas')).toHaveAttribute('data-camera', /./);
    const page_ = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      banner: document.querySelector('.banner')!.getBoundingClientRect().height,
      frame: document.querySelector('.map-frame')!.getBoundingClientRect().height,
    }));
    expect(page_.width).toBeLessThanOrEqual(viewport.width);
    expect(page_.height).toBeLessThanOrEqual(viewport.height);
    expect(page_.banner).toBeLessThanOrEqual(48);
    expect(page_.frame).toBeGreaterThanOrEqual(viewport.height - 48);
    // No emoji in the HUD.
    const hud = await page.locator('.map-frame').innerText();
    expect(hud).not.toMatch(/\p{Extended_Pictographic}/u);
  });
}
