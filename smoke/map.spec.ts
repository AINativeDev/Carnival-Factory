import { expect, test } from './coverage';
import { MAP_FRAME_BUDGET_MS, carnivalWorld, present, watch } from './support/carnival';

/**
 * The map as a whole: walking it with the keyboard, its frame budget while
 * the player walks, its HUD and banner, the screen-reader guide, and fitting
 * a laptop's and a phone's window without scrolling. Everything here is about
 * the island, not any one square on it.
 */

test('the player walks the world with the keyboard, and it stays quiet', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  const { start } = carnivalWorld();
  await expect(canvas).toHaveAttribute('data-player', `${start.x},${start.y}`);
  await canvas.focus();
  for (const key of ['ArrowRight', 'd', 'ArrowDown', 's']) {
    const before = present(await canvas.getAttribute('data-player'), 'player on the map');
    await page.keyboard.down(key);
    await page.waitForTimeout(400);
    await page.keyboard.up(key);
    await expect(canvas).not.toHaveAttribute('data-player', before);
  }
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

test('the screen-reader guide shows itself when a link in it has keyboard focus', async ({
  page,
}) => {
  await page.goto('#/');
  const guide = page.locator('.map > .visually-hidden');
  expect(present(await guide.boundingBox(), 'guide box').width).toBeLessThanOrEqual(1);
  await page.locator('.map > .visually-hidden a').first().focus();
  expect(present(await guide.boundingBox(), 'guide box').width).toBeGreaterThan(100);
  await expect(guide.getByRole('link', { name: 'get a booth' })).toBeInViewport();
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
      banner: document.querySelector('.banner')?.getBoundingClientRect().height ?? Infinity,
      frame: document.querySelector('.map-frame')?.getBoundingClientRect().height ?? 0,
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

test('the banner links to the repository, where every booth starts', async ({ page }) => {
  await page.goto('#/');
  const link = page.getByRole('link', { name: "See how it's built on GitHub" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://github.com/AINativeDev/Carnival-Factory');
});
