import { expect, test, type Page } from './coverage';
import { MAX_PINCH_ZOOM } from '../src/northpole/camera-view';
import { present, watch } from './support/carnival';
import { boxOf, cameraOf } from './support/map-canvas';

/**
 * Zooming the map: the "+" and "−" buttons, the wheel over the map and the
 * + and - keys, at laptop and phone width, on the North Pole and on a level,
 * read from the camera's zoom in `data-camera`. Apart from the map's own
 * tests because zoom is about the camera, not the island or a square.
 */

/** The camera's zoom once it has stopped easing. */
async function settledZoom(page: Page) {
  const canvas = page.locator('.map-canvas');
  let camera = '';
  while (camera !== (camera = present(await canvas.getAttribute('data-camera'), 'camera'))) {
    await page.waitForTimeout(400);
  }
  return (await cameraOf(canvas)).zoom;
}

/** Presses a zoom button until the map turns it off at its limit. */
async function pressToLimit(page: Page, label: 'Zoom in' | 'Zoom out') {
  const button = page.getByRole('button', { name: label });
  for (let n = 0; n < 30 && (await button.isEnabled()); n++) {
    await button.click();
    await page.waitForTimeout(80);
  }
  await expect(button).toBeDisabled();
}

for (const viewport of [
  { width: 1500, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`the buttons, the wheel and the keys zoom the map at ${String(viewport.width)} wide`, async ({
    page,
  }) => {
    const problems = watch(page);
    await page.setViewportSize(viewport);
    await page.goto('#/');
    const canvas = page.locator('.map-canvas');
    await expect(canvas).toHaveAttribute('data-camera', /./);
    const start = await settledZoom(page);

    await page.getByRole('button', { name: 'Zoom in' }).click();
    const nearer = await settledZoom(page);
    expect(nearer).toBeGreaterThan(start);
    await page.getByRole('button', { name: 'Zoom out' }).click();
    expect(await settledZoom(page)).toBeLessThan(nearer);

    // The wheel zooms over the map, and the page itself never scrolls.
    const box = await boxOf(canvas);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const before = await settledZoom(page);
    await page.mouse.wheel(0, -300);
    const wheeled = await settledZoom(page);
    expect(wheeled).toBeGreaterThan(before);
    await page.mouse.wheel(0, 300);
    expect(await settledZoom(page)).toBeLessThan(wheeled);
    expect(await page.evaluate(() => scrollY)).toBe(0);

    await canvas.focus();
    const keyed = await settledZoom(page);
    await page.keyboard.press('=');
    const pressed = await settledZoom(page);
    expect(pressed).toBeGreaterThan(keyed);
    await page.keyboard.press('-');
    expect(await settledZoom(page)).toBeLessThan(pressed);

    // No nearer than the nearest, and no farther than the whole island, where each button turns off.
    await pressToLimit(page, 'Zoom in');
    expect(await settledZoom(page)).toBeCloseTo(MAX_PINCH_ZOOM, 3);
    await pressToLimit(page, 'Zoom out');
    const island = await settledZoom(page);
    await page.getByRole('button', { name: 'Show the whole island' }).click();
    expect(await settledZoom(page)).toBeCloseTo(island, 3);
    expect(problems).toEqual([]);
  });
}

test('a level zooms with the same buttons and keys', async ({ page }) => {
  const problems = watch(page);
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto('#/level/jedi4ever');
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-camera', /./);
  const start = await settledZoom(page);
  await page.getByRole('button', { name: 'Zoom out' }).click();
  const farther = await settledZoom(page);
  expect(farther).toBeLessThan(start);
  await page.locator('.map-canvas').focus();
  await page.keyboard.press('+');
  expect(await settledZoom(page)).toBeGreaterThan(farther);
  expect(problems).toEqual([]);
});
