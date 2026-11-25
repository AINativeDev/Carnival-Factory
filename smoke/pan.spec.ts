import { expect, test, type Page } from './coverage';
import { present, watch } from './support/carnival';
import { boxOf } from './support/map-canvas';

/**
 * Dragging the map with the mouse looks round it, as a finger does on a phone
 * (docs/specs/map-and-world.md): the camera follows, the cursor grabs, and
 * letting go is no click, so the player stays where they stood. Apart from the
 * zoom's tests because this is about where the camera looks, not how near.
 */

/** The camera once it has stopped easing. */
async function settledCamera(page: Page) {
  const canvas = page.locator('.map-canvas');
  let camera = '';
  while (camera !== (camera = present(await canvas.getAttribute('data-camera'), 'camera'))) {
    await page.waitForTimeout(400);
  }
  return camera;
}

test('dragging the map with the mouse looks around, and its release does not walk', async ({
  page,
}) => {
  const problems = watch(page);
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-camera', /./);
  const before = await settledCamera(page);
  const player = present(await canvas.getAttribute('data-player'), 'player on the map');

  const box = await boxOf(canvas);
  const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x - 150, from.y - 90, { steps: 8 });
  await expect(canvas).toHaveCSS('cursor', 'grabbing');
  await page.mouse.up();

  expect(await settledCamera(page)).not.toBe(before);
  await expect(canvas).toHaveAttribute('data-player', player);
  expect(new URL(page.url()).hash).toBe('#/');
  expect(problems).toEqual([]);
});
