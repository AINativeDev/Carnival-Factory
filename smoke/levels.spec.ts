import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { levelWorld, validateLevel, type NorthPoleLevel } from '../src/northpole/level';
import { stillCamera, walkToDoor } from './level-walk';

/**
 * Walks every level: from its arrival point to each of its squares, inside
 * each one while its sandboxed frame plays, and back out to the sleigh home,
 * which takes the player back to the North Pole. Fails on anything the page or
 * a frame shouldn't do. Saves a screenshot of each level from its arrival
 * point, and of each of its squares from inside, for the pull request and the
 * risk check (plugins/north-pole/skills/assess-booth-risk).
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

// On a pull request that only changes one level, CI walks just that level
// (scripts/smoke-scope.ts); a pull request for one booth still walks them all.
const only = process.env.SMOKE_ONLY;
const walked = only?.startsWith('level/')
  ? logins.filter((login) => `level/${login}` === only)
  : logins;

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

for (const login of walked) {
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
        await expect(page.locator('.visit')).toContainText(`@${login}`);
        await page.waitForTimeout(1500);
        await expect(frame).toHaveAttribute('data-state', 'ready');
        await canvas.screenshot({ path: join(SHOTS, `level-${login}-${plot.id}.png`) });
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
