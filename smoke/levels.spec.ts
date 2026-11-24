import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { worldToScreen } from '../northpole/camera';
import { levelWorld, validateLevel, type NorthPoleLevel } from '../northpole/level';
import { canStand, toScreen, type Plot, type Tile, type World } from '../northpole/world';

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

/** Waits until the camera stands still, and says where it is. */
async function stillCamera(page: Page) {
  const canvas = page.locator('.map-canvas');
  let camera = '';
  while (camera !== (camera = (await canvas.getAttribute('data-camera')) ?? '')) {
    await page.waitForTimeout(400);
  }
  const [x, y, zoom] = camera.split(',').map(Number);
  return { x, y, zoom };
}

/**
 * Walks the player to a plot's door: a click on the ground just past it, which
 * the map walks to, then a step back along the tile row to the door. Clicking
 * the door itself would land on the stall in front of it.
 */
async function walkToDoor(page: Page, world: World, plot: Plot) {
  const canvas = page.locator('.map-canvas');
  const past: Tile = { x: plot.door.x + 1, y: plot.door.y };
  expect(canStand(world, past), `the tile past ${plot.kind} ${plot.id}'s door is clear`).toBe(true);
  const camera = await stillCamera(page);
  const box = (await canvas.boundingBox())!;
  const at = worldToScreen(toScreen(past), box.width, box.height, camera, camera.zoom);
  await canvas.click({ position: at });
  await expect(canvas).toHaveAttribute('data-player', `${past.x},${past.y}`, { timeout: 15_000 });
  // One tile back toward the door: up and left on screen together.
  await page.waitForTimeout(300);
  await page.keyboard.down('w');
  await page.keyboard.down('a');
  await page.waitForTimeout(200);
  await page.keyboard.up('w');
  await page.keyboard.up('a');
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
    const ids = readdirSync(join(root, 'levels', login, 'squares'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(validateLevel(level, login, ids)).toEqual([]);
    const world = levelWorld(level);
    await page.goto(`#/level/${login}`);
    const canvas = page.locator('.map-canvas');
    await expect(page.locator('.hud-level')).toContainText(level.name);
    await expect(canvas).toHaveAttribute('data-player', `${world.start.x},${world.start.y}`);
    await stillCamera(page);
    await canvas.screenshot({ path: join(SHOTS, `level-${login}.png`) });
    await canvas.focus();

    for (const plot of world.plots.filter((p) => p.kind === 'attraction')) {
      await walkToDoor(page, world, plot);
      await page.keyboard.press('e');
      await expect(page).toHaveURL(new RegExp(`#/level/${login}/${plot.id}$`));
      const frame = page.locator(`iframe[data-kind="level"][data-id="${login}/${plot.id}"]`);
      await expect(frame).toHaveAttribute('data-state', 'ready', { timeout: 5000 });
      await expect(page.locator('.visit')).toContainText(`@${login}`);
      await page.waitForTimeout(1500);
      await expect(frame).toHaveAttribute('data-state', 'ready');
      await page.keyboard.press('Escape');
      await expect(page.locator('.visit')).toHaveCount(0);
      await canvas.focus();
    }

    const home = world.plots.find((p) => p.kind === 'exit')!;
    await walkToDoor(page, world, home);
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
  await page.goto('#/level/no-such-level-here');
  await expect(page.locator('.map-note')).toContainText("There's no level for @no-such-level-here");
  await page.locator('.map-canvas').focus();
  expect(problems).toEqual([]);
});
