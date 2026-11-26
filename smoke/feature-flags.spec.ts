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

test("no way to ask for a level: no form link on the map or a booth's panel", async ({ page }) => {
  test.skip(FLAGS.levels, "participants' levels are switched on in this build");
  await page.goto('#/booth/jedi4ever');
  await expect(page.locator('.hud.visit')).toBeVisible();
  await expect(page.locator('a[href*="02-your-level"]:visible')).toHaveCount(0);
});

test("the Factory's, the Academy's and the Studio's landmarks open their sites in a new tab", async ({
  page,
  context,
}) => {
  test.skip(FLAGS.levels, 'levels are switched on in this build');
  await context.route('https://tessl.io/**', (route) => route.fulfill({ body: 'tessl' }));
  const canvas = page.locator('.map-canvas');
  for (const [id, url] of [
    [
      'the-factory',
      'https://tessl.io/?utm_source=carnival-factory&utm_medium=the-factory&utm_campaign=christmas-edition',
    ],
    [
      'the-academy',
      'https://tessl.io/academy?utm_source=carnival-factory&utm_medium=the-academy&utm_campaign=christmas-edition',
    ],
    [
      'the-studio',
      'https://tessl.io/podcast/?utm_source=carnival-factory&utm_medium=the-studio&utm_campaign=christmas-edition',
    ],
  ] as const) {
    await page.goto(`#/?attraction=${id}`);
    await expect(canvas).toHaveAttribute('data-selected', `attraction:${id}`);
    await canvas.focus();
    const site = context.waitForEvent('page');
    await page.keyboard.press('e');
    expect((await site).url()).toBe(url);
    await expect(page).not.toHaveURL(/#\/level\//);
  }
});

test('no Year in Review on the map, in the Attractions list or at its link', async ({ page }) => {
  test.skip(FLAGS.yearInReview, 'the Year in Review is switched on in this build');
  await page.goto('#/attraction/the-year-in-review');
  await expect(page.locator('.map-note')).toBeVisible();
  await expect(page.locator('.hud.visit')).toHaveCount(0);
  await expect(page.locator('.hud-attractions li').first()).toBeAttached();
  await expect(page.locator('.hud-attractions')).not.toContainText('Year in Review');
});

test("no People's Choice below the map or on a booth's panel", async ({ page }) => {
  test.skip(FLAGS.peoplesChoice, "People's Choice is switched on in this build");
  await page.goto('#/');
  await expect(page.locator('.map-canvas')).toBeVisible();
  await expect(page.locator('.choice')).toBeHidden();
  await page.goto('#/booth/jedi4ever');
  await expect(page.locator('.hud.visit')).toBeVisible();
  await expect(page.locator('.visit-vote')).toBeHidden();
});
