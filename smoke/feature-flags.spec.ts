import { expect, test } from './coverage';
import { FLAGS } from './support/feature-flags';

/**
 * The unfinished features the live build hides behind feature flags
 * (docs/adr/0046-launch-behind-feature-flags.md) are really gone from the
 * page: each check runs only while its flag is off.
 */

test('no Remix this booth in a booth’s panel', async ({ page }) => {
  test.skip(FLAGS.remix, 'remixing is switched on in this build');
  await page.goto('#/booth/jedi4ever');
  const card = page.locator('.hud.visit');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: 'Remix this booth' })).toBeHidden();
});

test('no advent calendar: its address shows the map, and nothing links to it', async ({ page }) => {
  test.skip(FLAGS.advent, 'the advent calendar is switched on in this build');
  await page.goto('#/advent');
  await expect(page.locator('.map-canvas')).toBeVisible();
  await expect(page.locator('.hud.advent')).toHaveCount(0);
  await page.goto('#/factory');
  await expect(page.locator('.hud.factory')).toBeVisible();
  await expect(page.locator('a[href="#/advent"]')).toHaveCount(0);
});

test('no Gift Shop on the map, in the Attractions list or at its link', async ({ page }) => {
  test.skip(FLAGS.giftShop, 'the Gift Shop is switched on in this build');
  await page.goto('#/attraction/gift-shop');
  await expect(page.locator('.map-note')).toBeVisible();
  await expect(page.locator('.hud.visit')).toHaveCount(0);
  await expect(page.locator('.hud-attractions li').first()).toBeAttached();
  await expect(page.locator('.hud-attractions')).not.toContainText('Gift Shop');
});

test('no Elf Engineer badge page or link from a booth', async ({ page, request }) => {
  test.skip(FLAGS.elfEngineer, 'the Elf Engineer badge is switched on in this build');
  await page.goto('#/booth/jedi4ever');
  await expect(page.locator('.hud.visit')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get the Elf Engineer badge' })).toHaveCount(0);
  await expect(page.locator('.visit-factory')).toBeHidden();
  const badges = await (await request.get('badges/index.html')).text();
  expect(badges).not.toContain('elf-engineer-gold.svg)]');
});
