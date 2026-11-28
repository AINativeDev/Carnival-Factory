import { expect, test } from './coverage';
import { watch } from './support/carnival';

/**
 * The one nudge to build your own (ADR 0065): after a minute on the map and a
 * square enjoyed, a quiet line points to the nearest free spot, once. The
 * page's clock is moved on rather than waited out, so the test stays quick.
 */

/** Opens the map at jedi4ever's booth, goes in with E, lingers, and comes back out. */
async function enjoyABooth(page: import('@playwright/test').Page) {
  await page.clock.install();
  await page.goto('#/?booth=jedi4ever');
  await page.clock.resume();
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever');
  await canvas.focus();
  await page.keyboard.press('e');
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  // Inside for real, so the time moved on counts as time spent in the booth.
  await expect(page.locator('.map-frame')).toHaveAttribute('data-visiting', 'booth:jedi4ever');
  await page.clock.fastForward('01:05');
  await page.keyboard.press('Escape');
  await expect(page.locator('.visit')).toHaveCount(0);
}

test('after a booth enjoyed, the map nudges once towards a free spot, and Show me walks there', async ({
  page,
}) => {
  const problems = watch(page);
  await enjoyABooth(page);
  const nudge = page.locator('.nudge');
  await expect(nudge).toBeVisible();
  await expect(nudge).toHaveAttribute('role', 'status');
  await expect(nudge).toContainText('free spot nearby');
  await nudge.getByRole('button', { name: 'Show me →' }).click();
  await expect(nudge).toHaveCount(0);
  await expect(page.locator('.map-canvas')).toBeFocused();
  expect(problems).toEqual([]);
});

test('Not now closes the nudge for good', async ({ page }) => {
  await enjoyABooth(page);
  await page.locator('.nudge').getByRole('button', { name: 'Not now' }).click();
  await expect(page.locator('.nudge')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('north-pole-nudge-closed'))).toBe('1');
});

test('a phone sees the nudge clear of the map buttons, inside the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enjoyABooth(page);
  const box = await page.locator('.nudge').boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
  const claim = await page.locator('.hud-claim').boundingBox();
  if (claim && box) expect(box.y + box.height).toBeLessThanOrEqual(claim.y);
});
