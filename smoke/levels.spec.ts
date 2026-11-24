import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { worldToScreen } from '../northpole/camera';
import { levelWorld, validateLevel, type NorthPoleLevel } from '../northpole/level';
import { canStand, findPath, toScreen, type Plot, type Tile, type World } from '../northpole/world';

/**
 * Walks every level: from its arrival point to each of its squares, inside
 * each one while its sandboxed frame plays, and back out to the sleigh home,
 * which takes the player back to the North Pole. Fails on anything the page or
 * a frame shouldn't do. Saves a screenshot of each level for the pull request.
 */

const root = join(import.meta.dirname, '..');
const SHOTS = join(root, 'screenshots');
const disabled = JSON.parse(readFileSync(join(root, 'northpole/disabled.json'), 'utf8')) as {
  levels?: string[];
};
const off = new Set((disabled.levels ?? []).map((login) => login.toLowerCase()));
const logins = readdirSync(join(root, 'levels'))
  .filter((name) => existsSync(join(root, 'levels', name, 'level.ts')) && !off.has(name))
  .sort();

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

/** Waits until the camera stands still, and says where it is. Gives up after 15 seconds. */
async function stillCamera(page: Page) {
  const canvas = page.locator('.map-canvas');
  const until = Date.now() + 15_000;
  let camera = '';
  while (
    camera !== (camera = (await canvas.getAttribute('data-camera', { timeout: 5000 })) ?? '')
  ) {
    if (Date.now() > until) throw new Error(`the camera never stood still, last at ${camera}`);
    await page.waitForTimeout(400);
  }
  const [x, y, zoom] = camera.split(',').map(Number);
  return { x, y, zoom };
}

/**
 * The tiles beside a door the player can step onto it from, each with the
 * keys for that one step: from the east up and left on screen, from the south
 * up and right, and from the north down and left. West of a door is its stall.
 */
const APPROACHES: { dx: number; dy: number; keys: [string, string] }[] = [
  { dx: 1, dy: 0, keys: ['w', 'a'] },
  { dx: 0, dy: 1, keys: ['w', 'd'] },
  { dx: 0, dy: -1, keys: ['s', 'a'] },
];

/**
 * Walks the player to a plot's door: a click on the ground beside it, which
 * the map walks to, then a step onto the door. Clicking the door itself would
 * land on the stall in front of it. A player already on the door, such as one
 * who arrived there, stays put.
 */
async function walkToDoor(page: Page, world: World, plot: Plot) {
  const canvas = page.locator('.map-canvas');
  if ((await canvas.getAttribute('data-player')) === `${plot.door.x},${plot.door.y}`) {
    await expect(canvas).toHaveAttribute('data-near', `${plot.kind}:${plot.id}`);
    return;
  }
  const approach = APPROACHES.map(({ dx, dy, keys }) => ({
    beside: { x: plot.door.x + dx, y: plot.door.y + dy } as Tile,
    keys,
  })).find(
    ({ beside }) => canStand(world, beside) && findPath(world, world.start, beside) !== undefined,
  );
  expect(approach, `a tile beside ${plot.kind} ${plot.id}'s door is clear`).toBeDefined();
  const { beside, keys } = approach!;
  const camera = await stillCamera(page);
  const box = (await canvas.boundingBox())!;
  const at = worldToScreen(toScreen(beside), box.width, box.height, camera, camera.zoom);
  expect(
    at.x >= 0 && at.y >= 0 && at.x < box.width && at.y < box.height,
    `the tile beside ${plot.kind} ${plot.id}'s door, at ${Math.round(at.x)}, ${Math.round(at.y)}, is on the canvas`,
  ).toBe(true);
  await canvas.click({ position: at, timeout: 10_000 });
  await expect(canvas).toHaveAttribute('data-player', `${beside.x},${beside.y}`, {
    timeout: 15_000,
  });
  await page.waitForTimeout(300);
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(200);
  for (const key of keys) await page.keyboard.up(key);
  await expect(canvas).toHaveAttribute('data-near', `${plot.kind}:${plot.id}`);
}

mkdirSync(SHOTS, { recursive: true });

for (const login of logins) {
  test(`level ${login} walks from its arrival to every square and back home, quietly`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const problems = watch(page);
    const { default: level } = (await import(`../levels/${login}/level.ts`)) as {
      default: NorthPoleLevel;
    };
    // The same squares the page finds: every squares/<id>/square.ts, if any.
    const folder = join(root, 'levels', login, 'squares');
    const ids = existsSync(folder)
      ? readdirSync(folder).filter((id) => existsSync(join(folder, id, 'square.ts')))
      : [];
    expect(validateLevel(level, login, ids)).toEqual([]);
    const world = levelWorld(level);
    await page.goto(`#/level/${login}`);
    const canvas = page.locator('.map-canvas');
    await expect(page.locator('.hud-level')).toContainText(level.name);
    await expect(canvas).toHaveAttribute('data-player', `${world.start.x},${world.start.y}`);
    await stillCamera(page);
    await canvas.screenshot({ path: join(SHOTS, `level-${login}.png`) });
    await canvas.focus({ timeout: 5000 });

    for (const plot of world.plots.filter((p) => p.kind === 'attraction')) {
      await test.step(`walk to ${plot.id}`, () => walkToDoor(page, world, plot));
      await test.step(`inside ${plot.id}`, async () => {
        await page.keyboard.press('e');
        await expect(page).toHaveURL(new RegExp(`#/level/${login}/${plot.id}$`));
        const frame = page.locator(`iframe[data-kind="level"][data-id="${login}/${plot.id}"]`);
        await expect(frame).toHaveAttribute('data-state', 'ready', { timeout: 5000 });
        await expect(page.locator('.visit')).toContainText(`@${login}`);
        await page.waitForTimeout(1500);
        await expect(frame).toHaveAttribute('data-state', 'ready');
        await page.keyboard.press('Escape');
        await expect(page.locator('.visit')).toHaveCount(0);
        // The room fades out before the map is drawn, and its camera moves, again.
        await expect(canvas).not.toHaveAttribute('data-room', /.*/);
        await canvas.focus({ timeout: 5000 });
      });
    }

    const home = world.plots.find((p) => p.kind === 'exit')!;
    await test.step('walk to the sleigh home', () => walkToDoor(page, world, home));
    await page.keyboard.press('e');
    await expect(page).toHaveURL(/#\/$/);
    // Back at the North Pole, the station has this level's platform.
    await expect(canvas).toHaveAttribute('data-player', /./);
    expect(problems).toEqual([]);
  });
}

test("a level's deep links say when a level or square isn't there", async ({ page }) => {
  test.skip(!logins.length, 'no levels');
  const problems = watch(page);
  const [login] = logins;
  await page.goto(`#/level/${login}?square=nowhere`);
  await expect(page.locator('.map-note')).toContainText('has no square called "nowhere"');
  await page.goto(`#/level/${login}/nowhere`);
  await expect(page.locator('.map-note')).toContainText('has no square called "nowhere"');
  await expect(page.locator('.visit')).toHaveCount(0);
  await page.goto('#/level/no-such-level-here');
  await expect(page.locator('.map-note')).toContainText("There's no level for @no-such-level-here");
  await page.locator('.map-canvas').focus();
  expect(problems).toEqual([]);
});
