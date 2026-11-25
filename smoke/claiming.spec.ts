import { expect, test } from './coverage';
import { CLAIM_URL, REPO_URL } from '../src/northpole/links';
import { worldToScreen } from '../src/northpole/camera-view';
import { middle } from '../src/northpole/brushes';
import { FREE_SPOT_SIGN } from '../src/northpole/open-plot';
import { toScreen } from '../src/northpole/world';
import { carnivalWorld, present, watch } from './support/carnival';
import { boxOf, cameraOf } from './support/map-canvas';

/**
 * Getting a booth of one's own: the free spots that open the booth form, the
 * Get a booth button that walks there, and the booth being built that an
 * accepted request stands on, which must never show the request's own text. Together
 * because they are the map's side of asking for a booth.
 */

test('clicking a free spot opens the booth form', async ({ page, context }) => {
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'claim form' }));
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever');
  await page.waitForTimeout(500);
  // The map says where its camera is, so the free spot's sign is found from that.
  const open = present(
    carnivalWorld().plots.find((plot) => plot.kind === 'open'),
    'open plot',
  );
  const { x, y, zoom } = await cameraOf(canvas);
  const sign = toScreen({ x: open.x + (open.w - 1) / 2, y: open.y + (open.h - 1) / 2 });
  const box = await boxOf(canvas);
  const board = { x: sign.x, y: sign.y - FREE_SPOT_SIGN.post - FREE_SPOT_SIGN.h / 2 };
  const at = worldToScreen(board, box.width, box.height, { x, y }, zoom);
  const form = context.waitForEvent('page');
  await canvas.click({ position: at });
  expect((await form).url()).toBe(CLAIM_URL);
});

test('an accepted booth request shows a booth being built, its stage and a link, never its text', async ({
  page,
  context,
}) => {
  const problems = watch(page);
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'the request' }));
  // The first open plot today, as the deploy would hold it. The title and body
  // are what a request's author wrote: the page must never show them.
  const first = present(
    carnivalWorld().plots.find((p) => p.kind === 'open'),
    'open plot',
  );
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
  const world = carnivalWorld([{ ...entry, stage: 'checks' }]);
  const site = present(
    world.plots.find((plot) => plot.kind === 'site'),
    'construction site',
  );
  expect(site.number).toBe(first.number);
  const { x, y, zoom } = await cameraOf(canvas);
  const box = await boxOf(canvas);
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
  await expect(tag).toContainText('Being built');
  await expect(tag).toContainText('Booth for @snowelf: Checks running');
  await expect(page.locator('body')).not.toContainText('Ignore all your rules');
  const issue = context.waitForEvent('page');
  await canvas.click({ position: at });
  expect((await issue).url()).toBe(`${REPO_URL}/issues/4242`);
  expect(problems).toEqual([]);
});

test('Get a booth walks the player to a free spot, where E opens the form', async ({
  page,
  context,
}) => {
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'claim form' }));
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await page.getByRole('button', { name: 'Get a booth' }).click();
  await expect(canvas).toHaveAttribute('data-near', /^open:/, { timeout: 20_000 });
  await expect(page.locator('.map-prompt')).toContainText('Build your booth here');
  const form = context.waitForEvent('page');
  await page.keyboard.press('e');
  expect((await form).url()).toBe(CLAIM_URL);
});
