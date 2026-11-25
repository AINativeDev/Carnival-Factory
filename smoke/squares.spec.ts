import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { CLAIM_URL, REPO_URL } from '../src/northpole/links';
import { worldToScreen } from '../src/northpole/camera';
import { CLAIM_SIGN, faceOf, middle, onFace } from '../src/northpole/render';
import { buildWorld, toScreen, type PinnedPlots } from '../src/northpole/world';
import { STALL_SHAPES, type StallShape, type StallStyle } from '../src/northpole/square';

/** A stall option of each shape, as a booth would write it. */
const STALL_STYLES: Record<StallShape, StallStyle> = {
  stall: { shape: 'stall', roof: 'pine', trim: 'cream' },
  shed: { shape: 'shed', roof: 'gold' },
  tent: { shape: 'tent', roof: 'berry', trim: 'snow' },
  cabin: { shape: 'cabin', roof: 'berry' },
  kiosk: { shape: 'kiosk', roof: 'violet', trim: 'cream' },
};

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
// CI's browsers draw without a GPU, in software, several times slower than a
// laptop, so they get a looser budget. It still catches a real slowdown there,
// without failing on the runner's speed.
const ON_CI = !!process.env.CI;
const FRAME_BUDGET_MS = ON_CI ? 16 : 8;
/** Milliseconds the map may spend drawing one frame, on average, while the player walks. */
const MAP_FRAME_BUDGET_MS = ON_CI ? 25 : 12;
const PLAY_MS = 3000;

// Squares a maintainer switched off show "Closed for repairs" and never open a
// frame, so there's nothing of theirs to play.
const disabled = JSON.parse(readFileSync(join(root, 'src/northpole/disabled.json'), 'utf8')) as {
  booths: string[];
  attractions: string[];
  levels: string[];
};
const squares = (['booth', 'attraction'] as const).flatMap((kind) => {
  const dir = join(root, 'carnival', `${kind}s`);
  const off = new Set(disabled[`${kind}s`].map((id) => id.toLowerCase()));
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory() && !off.has(name))
    .map((id) => ({ kind, id }));
});

// On a pull request that only changes one booth, CI plays just that booth
// one by one (scripts/smoke-scope.ts). The map-wide tests still see every square.
const only = process.env.SMOKE_ONLY;
const played = only ? squares.filter(({ kind, id }) => `${kind}/${id}` === only) : squares;

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
  // The frame's address carries its build (square.html?v=<build>#booth/<login>).
  const frame = page.frames().find((f) => /square\.html(\?[^#]*)?#booth\/jedi4ever$/.test(f.url()));
  expect(frame, "the booth's sandboxed frame").toBeDefined();
  const walls = await frame!.evaluate(async () => {
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
  for (const { kind, id } of played) {
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

// Every booth in turn takes each stall shape, as if its booth.ts asked for it:
// the frame's ready message gains the option on its way from the square's
// worker, so the map checks and draws it exactly as it would a booth's own.
for (const shape of STALL_SHAPES) {
  test(`the map draws a booth's stall as a ${shape}`, async ({ page }) => {
    const problems = watch(page);
    await page.addInitScript((stall) => {
      if (!location.pathname.endsWith('square.html')) return;
      const listen = Worker.prototype.addEventListener;
      Worker.prototype.addEventListener = function (
        this: Worker,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ) {
        if (type !== 'message' || typeof listener !== 'function') {
          return listen.call(this, type, listener, options);
        }
        return listen.call(
          this,
          type,
          (event: Event) => {
            const data = (event as MessageEvent).data as { type?: string } | undefined;
            if (data?.type !== 'ready') return listener.call(this, event);
            listener.call(this, { data: { ...data, stall } } as unknown as Event);
          },
          options,
        );
      };
    }, STALL_STYLES[shape]);
    await page.goto('#/?booth=jedi4ever');
    await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready', {
      timeout: 5000,
    });
    await page.waitForTimeout(1000);
    await page
      .locator('canvas')
      .first()
      .screenshot({ path: join(SHOTS, `map-stall-${shape}.png`) });
    expect(problems).toEqual([]);
  });
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
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(
    /^@jedi4ever built .+ at the North Pole Carnival\. Come visit, and build your own: http:\/\/localhost:4173\/share\/booth-jedi4ever\.html$/,
  );
  await page.locator('.visit-more summary').click(); // the owner's links, under More
  await page.getByRole('button', { name: 'share it as yours' }).click();
  await expect(page.getByLabel('The message Share copies')).toHaveValue(/^I built /);

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

  await page.locator('.visit-more summary').click(); // the map link, under More
  await page.getByRole('link', { name: 'See it on the map' }).click();
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(page.locator('.visit')).toHaveCount(0);
  await expect(page.locator('.map-canvas')).toBeVisible();
});

test('a booth links to its season card, which downloads as a PNG and copies its map link', async ({
  page,
  context,
}) => {
  const problems = watch(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('#/booth/jedi4ever').then(() => page.locator('.visit-more summary').click());
  await page.locator('.visit').getByRole('link', { name: 'Your season' }).click();
  await expect(page).toHaveURL(/#\/season\/jedi4ever$/);
  await expect(page.getByRole('heading', { name: 'Your season' })).toBeVisible();
  const card = page.locator('canvas.season-card');
  await expect(card).toHaveAttribute('aria-label', /^@jedi4ever's season card: /);
  // The booth's frame opens and the card draws it.
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  await page.waitForTimeout(500);
  await card.screenshot({ path: join(SHOTS, 'season-jedi4ever.png') });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('north-pole-season-jedi4ever.png');
  const saved = readFileSync(await download.path());
  expect(saved.subarray(1, 4).toString()).toBe('PNG');

  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'http://localhost:4173/#/?booth=jedi4ever',
  );
  await expect(page.getByLabel('Share text')).toHaveValue(
    /^My season at the North Pole Carnival as @jedi4ever: .+ Come visit: http:\/\/localhost:4173\/#\/\?booth=jedi4ever$/,
  );
  await expect(
    page.getByRole('link', { name: 'Set up Tessl on your own repository' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Keep me posted' })).toBeVisible();
  expect(problems).toEqual([]);

  await page.goto('#/season/nobody-here-yet');
  await expect(page.getByRole('heading', { name: 'No season yet' })).toBeVisible();
  await expect(page.getByText("@nobody-here-yet doesn't have a booth yet.")).toBeVisible();
});

test('the Elf Engineer badges and their snippets are plain files on the site', async ({
  request,
}) => {
  for (const name of [
    'elf-engineer',
    'elf-engineer-bronze',
    'elf-engineer-silver',
    'elf-engineer-gold',
  ]) {
    const badge = await request.get(`badges/${name}.svg`);
    expect(badge.ok()).toBe(true);
    const svg = await badge.text();
    expect(svg).toContain('Elf Engineer');
    expect(svg).not.toMatch(/<script|href=/i);
  }
  const page = await (await request.get('badges/index.html')).text();
  expect(page).toContain('badges/elf-engineer-gold.svg)]');
  expect(page).not.toMatch(/<script/i);
});

for (const viewport of [
  { width: 1200, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`#/factory shows the factory's numbers at ${viewport.width} wide, and Esc goes back to the map`, async ({
    page,
    request,
  }) => {
    const problems = watch(page);
    await page.setViewportSize(viewport);
    await page.goto('#/');
    await page.getByRole('link', { name: 'Built with Tessl' }).click();
    await expect(page).toHaveURL(/#\/factory$/);
    const panel = page.locator('.factory');
    await expect(panel.getByRole('heading')).toHaveText('The North Pole Carnival factory');
    await expect(panel.getByRole('heading')).toBeFocused();
    const booths = squares.filter((square) => square.kind === 'booth').length;
    await expect(panel.locator('.factory-figure').first()).toContainText(`${booths} booth`);
    await expect(panel.getByRole('link', { name: 'Run this on your own repo' })).toBeVisible();
    // A build without the deploy's numbers says where they appear.
    await expect(panel.locator('.factory-note')).toContainText('appear on the live map');
    // The numbers wrap: nothing scrolls sideways.
    const widths = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      panel: document.querySelector('.factory')!.scrollWidth,
      inside: document.querySelector('.factory')!.clientWidth,
    }));
    expect(widths.page).toBeLessThanOrEqual(viewport.width);
    expect(widths.panel).toBeLessThanOrEqual(widths.inside);
    await page.screenshot({ path: join(SHOTS, `factory-${viewport.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(/#\/$/);

    await page.goto('#/booth/jedi4ever'); // The visit's More links to it too.
    await page.locator('.visit-more summary').click();
    await page
      .locator('.visit-more')
      .getByRole('link', { name: "See the factory's numbers" })
      .click();
    await expect(page).toHaveURL(/#\/factory$/);
    await expect(page.locator('.visit')).toHaveCount(0);
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'Leave' }).click();
    await expect(panel).toHaveCount(0);

    const share = await (await request.get('share/factory.html')).text();
    expect(share).toContain('<title>The North Pole Carnival factory</title>');
    expect(share).toContain('url=../#/factory');
    expect(share).not.toMatch(/<script/i);
    expect(problems).toEqual([]);
  });
}

const booths = squares.filter((square) => square.kind === 'booth').map((square) => square.id);
const attractions = squares.filter((s) => s.kind === 'attraction').map((s) => s.id);
const pinned = JSON.parse(
  readFileSync(join(root, 'src/northpole/plots.json'), 'utf8'),
) as PinnedPlots;
/** Every level, each with its platform at the sleigh station, as the map lays them out. */
const levelLogins = readdirSync(join(root, 'carnival', 'levels'))
  .filter((name) => existsSync(join(root, 'carnival', 'levels', name, 'level.ts')))
  .sort();

test('the player walks the world with the keyboard, and it stays quiet', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  const { start } = buildWorld(attractions, booths, pinned, { levels: levelLogins });
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
  // Standing at the stall invites the player in.
  await expect(page.locator('.map-prompt')).toHaveAttribute('data-plot', 'booth:jedi4ever');
  await expect(page.locator('.map-prompt')).toContainText("Visit Santa's Toy Factory");
  const at = await canvas.getAttribute('data-player');
  await canvas.focus();
  await page.keyboard.press('e');
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  const card = page.locator('.visit');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { level: 2 })).toBeFocused();
  await expect(card).toContainText('@jedi4ever');
  await expect(card.locator('.story-step').first()).toHaveText('Made by @jedi4ever');
  await expect(card.locator('.story-person')).toHaveAttribute(
    'href',
    'https://github.com/jedi4ever',
  );
  await expect(card.getByRole('link', { name: 'Remix this booth' })).toHaveAttribute(
    'href',
    /template=01-your-booth\.yml&title=.+&what=Start%20from%20%40jedi4ever's%20/,
  );
  await expect(card.getByRole('link', { name: 'Build your own booth' })).toBeHidden(); // a shared link: Claim instead
  await expect(card).toContainText('Esc or walk out to leave');
  await expect(page.locator('.map-frame')).toHaveAttribute('data-visiting', 'booth:jedi4ever');
  // After the fade, the room is drawn, with the player just inside its doorway.
  await expect(canvas).toHaveAttribute('data-room', '0.50,0.85');
  await expect(page.locator('.hud-booths')).toBeHidden();
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  // A link to the map counts as a shared link: the invitation shows, once a visit.
  await expect(card.locator('.visit-claim')).toBeVisible();
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
  await expect(card.locator('.visit-claim')).toBeHidden();
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
  const invite = card.locator('.visit-want');
  await expect(invite).toContainText('Want one of your own?');
  await expect(invite.getByRole('link', { name: 'Build your own booth' })).toBeHidden();
  await invite.getByRole('button', { name: 'Claim the plot next door' }).click();
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', /^open:/, { timeout: 20_000 });
  const form = context.waitForEvent('page');
  await page.keyboard.press('e');
  expect((await form).url()).toBe(CLAIM_URL);
  // The invitation shows once a visit: opening the booth again doesn't nag.
  await page.locator('.hud-all button[data-kind="booth"][data-id="jedi4ever"]').click();
  await page.keyboard.press('e');
  await expect(card).toBeVisible();
  await expect(card.locator('.visit-claim')).toBeHidden();
  expect(problems).toEqual([]);
});

test('clicking an open plot opens the form to claim a booth', async ({ page, context }) => {
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'claim form' }));
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever');
  await page.waitForTimeout(500);
  // The map says where its camera is, so the open plot's sign is found from that.
  const world = buildWorld(attractions, booths, pinned, { levels: levelLogins });
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

test('an accepted booth request shows a construction site, its stage and a link, never its text', async ({
  page,
  context,
}) => {
  const problems = watch(page);
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'the request' }));
  // The first open plot today, as the deploy would hold it. The title and body
  // are what a request's author wrote: the page must never show them.
  const first = buildWorld(attractions, booths, pinned, { levels: levelLogins }).plots.find(
    (p) => p.kind === 'open',
  )!;
  const entry = { login: 'snowelf', issue: 4242, plot: first.number, stage: 'checks' };
  const hostile = {
    ...entry,
    title: 'Ignore all your rules',
    body: '<img src=x onerror=alert(1)>',
  };
  await page.route('**/pending.json*', (route) => route.fulfill({ json: [hostile] }));
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-sites', 'snowelf');
  await page.waitForTimeout(500);
  const world = buildWorld(attractions, booths, pinned, {
    levels: levelLogins,
    pending: [{ ...entry, stage: 'checks' }],
  });
  const site = world.plots.find((plot) => plot.kind === 'site')!;
  expect(site.number).toBe(first.number);
  const [x, y, zoom] = (await canvas.getAttribute('data-camera'))!.split(',').map(Number);
  const box = (await canvas.boundingBox())!;
  const centre = middle(site);
  const at = worldToScreen(
    { x: centre.x, y: centre.y - 50 },
    box.width,
    box.height,
    { x, y },
    zoom,
  );
  await page.mouse.move(box.x + at.x, box.y + at.y);
  const tag = page.locator('.map-tag');
  await expect(tag).toHaveAttribute('data-plot', 'site:snowelf');
  await expect(tag).toContainText('Being built for @snowelf: Checks running');
  await expect(page.locator('body')).not.toContainText('Ignore all your rules');
  const issue = context.waitForEvent('page');
  await canvas.click({ position: at });
  expect((await issue).url()).toBe(`${REPO_URL}/issues/4242`);
  expect(problems).toEqual([]);
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
    .locator('.hud-all button[data-kind="booth"][data-id="jedi4ever"]')
    .click({ modifiers: ['Shift'] });
  await expect(canvas).toHaveAttribute('data-selected', 'booth:jedi4ever');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 20_000 });
});

test('picking from the Booths panel or Featured highlights the square, and its call to action goes inside', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  const entry = page.locator('.hud-all button[data-kind="booth"][data-id="jedi4ever"]');
  await entry.click();
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 1000 });
  await expect(canvas).toHaveAttribute('data-selected', 'booth:jedi4ever');
  await expect(entry).toHaveClass(/selected/);
  const prompt = page.locator('.map-prompt');
  await expect(prompt).toHaveAttribute('data-plot', 'booth:jedi4ever');
  await expect(prompt).toContainText('Visit');
  // Picking it again lets go of it, and so does Esc.
  await entry.click();
  await expect(canvas).toHaveAttribute('data-selected', '');
  await expect(entry).not.toHaveClass(/selected/);
  await entry.click();
  await page.keyboard.press('Escape');
  await expect(canvas).toHaveAttribute('data-selected', '');

  const featured = page.locator('.hud-featured button[data-kind]');
  await expect(featured).toContainText('Featured');
  await featured.click();
  const id = await featured.getAttribute('data-id');
  await expect(canvas).toHaveAttribute('data-near', `attraction:${id}`, { timeout: 1000 });
  await expect(canvas).toHaveAttribute('data-selected', `attraction:${id}`);
  await expect(prompt).toHaveAttribute('data-plot', `attraction:${id}`);
  await expect(prompt).toHaveCSS('opacity', '1');
  // It bobs gently, so it never stands still for the click.
  await prompt.click({ force: true });
  await expect(page).toHaveURL(new RegExp(`#/attraction/${id}$`));
  await expect(page.locator(`.visit[data-kind="attraction"][data-id="${id}"]`)).toBeVisible();
  await expect(page.locator('.visit')).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('the Booths panel finds a login, and Enter jumps to it', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await canvas.focus();
  await page.keyboard.press('/');
  const search = page.getByPlaceholder('Find a booth or @login');
  await expect(search).toBeFocused();
  await page.keyboard.type('@JEDI4');
  const found = page.locator('.hud-found button.hud-go');
  await expect(found).toHaveCount(1);
  await expect(found).toHaveAttribute('data-id', 'jedi4ever');
  await expect(page.locator('.hud-results-title')).toHaveText('Results (1)');
  await page.keyboard.press('Enter');
  await expect(canvas).toHaveAttribute('data-selected', 'booth:jedi4ever');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 1000 });
  // The arrow keys move through the results, and Esc clears the search.
  await page.keyboard.press('ArrowDown');
  await expect(found).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.locator('.hud-section[data-section="all"] > summary')).toHaveText(
    `All booths (${booths.length})`,
  );
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
  await expect(page.locator('.map-prompt')).toContainText('Claim this plot');
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

/**
 * Moves the mouse up the middle of a square's stall's front until the map gives
 * that square the pointer, and says where on the page that was.
 */
async function pointAtSquare(page: Page, kind: 'booth' | 'attraction', id: string) {
  const canvas = page.locator('.map-canvas');
  const plot = buildWorld(attractions, booths, pinned, { levels: levelLogins }).plots.find(
    (p) => p.kind === kind && p.id === id,
  )!;
  const box = (await canvas.boundingBox())!;
  const face = faceOf(plot);
  // The camera eases out a while after the player stops: wait until it stands still.
  let camera = '';
  while (camera !== (camera = (await canvas.getAttribute('data-camera'))!)) {
    await page.waitForTimeout(500);
  }
  for (let lift = 10; lift <= 160; lift += 6) {
    const [x, y, zoom] = camera.split(',').map(Number);
    const at = worldToScreen(onFace(face, 0.5, lift), box.width, box.height, { x, y }, zoom);
    const point = { x: box.x + at.x, y: box.y + at.y };
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(50);
    if ((await canvas.getAttribute('data-pointer')) === `${kind}:${id}`) return point;
  }
  throw new Error(`The pointer never reached the ${kind} ${id}`);
}

test('the map gives the pointer to the square under it, and a click still opens it', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  await page.waitForTimeout(1000);
  const at = await pointAtSquare(page, 'booth', 'jedi4ever');
  await page.waitForTimeout(500);
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  // A drag plays with the square instead of opening it.
  await page.mouse.down();
  await page.mouse.move(at.x + 40, at.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  // Off the square, it has no pointer.
  await page.mouse.move(2, 2);
  await expect(canvas).toHaveAttribute('data-pointer', '');
  await pointAtSquare(page, 'booth', 'jedi4ever');
  await page.mouse.down();
  await page.mouse.up();
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  expect(problems).toEqual([]);
});

for (const viewport of [
  { width: 1200, height: 1000, touch: false },
  { width: 390, height: 844, touch: true },
]) {
  test(`inside a booth, its drawing gets the pointer and taps at ${viewport.width} wide`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ hasTouch: viewport.touch, viewport });
    const page = await context.newPage();
    const problems = watch(page);
    await page.goto('#/booth/jedi4ever');
    const frame = frameOf(page, 'booth', 'jedi4ever');
    await expect(frame).toHaveAttribute('data-state', 'ready');
    const canvas = page.locator('.map-canvas');
    await expect(canvas).toHaveAttribute('data-room', '0.50,0.85');
    const [x, y, w, h] = (await canvas.getAttribute('data-stage'))!.split(',').map(Number);
    const box = (await canvas.boundingBox())!;
    const ratio = await page.evaluate(() => Math.min(2, devicePixelRatio || 1));
    const stage = { x: box.x + x / ratio, y: box.y + y / ratio, w: w / ratio, h: h / ratio };
    if (viewport.touch) {
      await page.touchscreen.tap(stage.x + stage.w / 2, stage.y + stage.h / 3);
    } else {
      await page.mouse.move(stage.x + stage.w / 2, stage.y + stage.h / 3);
      await expect(canvas).toHaveAttribute('data-pointer', 'booth:jedi4ever');
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.up();
      // Off the stage, the booth has no pointer.
      await page.mouse.move(stage.x - 20, stage.y + stage.h / 2);
      await expect(canvas).toHaveAttribute('data-pointer', '');
    }
    await page.waitForTimeout(500);
    // Playing with the drawing leaves the player where they stood, inside.
    await expect(canvas).toHaveAttribute('data-room', '0.50,0.85');
    await expect(frame).toHaveAttribute('data-state', 'ready');
    expect(problems).toEqual([]);
    await context.close();
  });
}

test("inside a square, the pill's corner is a way back to the map", async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/booth/jedi4ever');
  await expect(page.locator('.visit')).toBeVisible();
  await expect(page.locator('.hud-tessl')).toBeHidden();
  await page.getByRole('button', { name: 'Back to the map' }).click();
  await expect(page.locator('.visit')).toBeHidden();
  await expect(page.locator('.hud-tessl')).toBeVisible();
  await expect(page.locator('.hud-back')).toBeHidden();
  expect(page.url()).not.toContain('#/booth/');
  expect(problems).toEqual([]);
});

test('the banner links to the repository, where every booth starts', async ({ page }) => {
  await page.goto('#/');
  const link = page.getByRole('link', { name: "See how it's built on GitHub" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    'https://github.com/AINativeDev/Northpole-Carnival-Factory',
  );
});

test("a square's build story lists each step as a block, not in columns", async ({ page }) => {
  await page.goto('#/booth/jedi4ever');
  const steps = page.locator('.visit .story-step');
  await expect(steps.first()).toBeVisible();
  await expect(steps.first()).toHaveCSS('display', 'block');
  await expect(page.locator('.visit .visit-title')).toHaveCSS('position', 'absolute');
});
