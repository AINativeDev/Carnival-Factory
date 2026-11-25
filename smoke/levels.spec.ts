import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './coverage';
import { levelWorld, validateLevel, type NorthPoleLevel } from '../src/northpole/level';
import { isNorthPoleLevel } from '../src/northpole/north-pole-levels';
import { stillCamera, walkToDoor } from './level-walk';

/**
 * Walks every level: from its arrival point to each of its squares, inside
 * each one while its sandboxed frame plays, and back out to the sleigh home,
 * which takes the player back to the North Pole. Fails on anything the page or
 * a frame shouldn't do. Saves a screenshot of each level for the pull request.
 */

const root = join(import.meta.dirname, '..');
const SHOTS = join(root, 'screenshots');
const disabled = JSON.parse(readFileSync(join(root, 'src/northpole/disabled.json'), 'utf8')) as {
  levels?: string[];
};
const off = new Set((disabled.levels ?? []).map((login) => login.toLowerCase()));
const logins = readdirSync(join(root, 'carnival', 'levels'))
  .filter(
    (name) => existsSync(join(root, 'carnival', 'levels', name, 'level.ts')) && !off.has(name),
  )
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

mkdirSync(SHOTS, { recursive: true });

for (const login of logins) {
  test(`level ${login} walks from its arrival to every square and back home, quietly`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const problems = watch(page);
    const { default: level } = (await import(`../carnival/levels/${login}/level.ts`)) as {
      default: NorthPoleLevel;
    };
    // The same squares the page finds: every squares/<id>/square.ts, if any.
    const folder = join(root, 'carnival', 'levels', login, 'squares');
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
        // A participant's level credits its owner; the North Pole's own tell their step instead.
        const credit = isNorthPoleLevel(login) ? 'See the factory’s numbers' : `@${login}`;
        await expect(page.locator('.visit')).toContainText(credit);
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

test('a level has the way back to the North Pole in its corner, until you go inside a square', async ({
  page,
}) => {
  const login = logins.at(0) ?? '';
  test.skip(!login, 'no levels');
  const square = readdirSync(join(root, 'carnival', 'levels', login, 'squares')).at(0) ?? '';
  await page.goto(`#/level/${login}/${square}`);
  await expect(page.locator('.visit')).toBeVisible();
  await expect(page.locator('.hud-home')).toBeHidden();
  await expect(page.locator('.hud-back')).toBeVisible();
  await page.goto(`#/level/${login}`);
  const home = page.locator('.hud-home');
  await expect(home).toBeVisible();
  await expect(home).toHaveText(/Back to the North Pole/);
  // On a phone, the level's panel sits below the way home, never over it.
  await page.setViewportSize({ width: 390, height: 844 });
  const corner = await home.boundingBox();
  const card = await page.locator('.hud-level').boundingBox();
  expect(card && corner && card.y >= corner.y + corner.height).toBe(true);
  await home.click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('.hud-home')).toHaveCount(0);
});

test("a level's panel tells how it was built beside its map, clear of the way home", async ({
  page,
}) => {
  const login = logins.find((one) => !isNorthPoleLevel(one)) ?? '';
  test.skip(!login, 'no participant levels');
  const problems = watch(page);
  const square = readdirSync(join(root, 'carnival', 'levels', login, 'squares')).at(0) ?? '';
  for (const size of [
    { width: 1500, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.goto(`#/level/${login}`);
    const panel = page.locator('.hud-level');
    await expect(panel.getByRole('heading', { name: 'How it was built' })).toBeVisible();
    await expect(panel.locator('.story-step').first()).toContainText(`@${login}`);
    await expect(panel.locator('.visit-copy')).toBeVisible();
    await expect(panel.locator('.visit-build')).toHaveText('Ask for a level of your own');
    await expect(panel.locator('.visit-remix-link')).toBeHidden();
    const home = await page.locator('.hud-home').boundingBox();
    const box = await panel.boundingBox();
    if (!home || !box) throw new Error('The way home or the panel has no box');
    const apart =
      box.x >= home.x + home.width ||
      home.x >= box.x + box.width ||
      box.y >= home.y + home.height ||
      home.y >= box.y + box.height;
    expect(apart, `the panel covers the way home at ${size.width}px`).toBe(true);
    // Inside one of its squares, that square's panel takes its place, and it comes back after.
    await page.goto(`#/level/${login}/${square}`);
    await expect(page.locator('.visit')).toBeVisible();
    await expect(panel).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('.visit')).toHaveCount(0);
    await expect(panel).toBeVisible();
  }
  expect(problems).toEqual([]);
});

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
