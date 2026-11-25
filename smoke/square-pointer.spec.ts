import { expect, test, type Page } from './coverage';
import { worldToScreen } from '../src/northpole/camera';
import { faceOf, onFace } from '../src/northpole/faces';
import { carnivalWorld, frameOf, present, watch } from './support/carnival';
import { boxOf, cameraFrom, stageOf } from './support/map-canvas';

/**
 * Hover and taps reaching a square: on the map through its stall's front,
 * where a click still goes inside, and inside on the back wall, with a mouse
 * and with a finger at phone width. Apart from the visit tests because these
 * aim the pointer at a square's drawing rather than walk the player.
 */

/**
 * Moves the mouse up the middle of a square's stall's front until the map gives
 * that square the pointer, and says where on the page that was.
 */
async function pointAtSquare(page: Page, kind: 'booth' | 'attraction', id: string) {
  const canvas = page.locator('.map-canvas');
  const plot = present(
    carnivalWorld().plots.find((p) => p.kind === kind && p.id === id),
    `plot of the ${kind} ${id}`,
  );
  const box = await boxOf(canvas);
  const face = faceOf(plot);
  // The camera eases out a while after the player stops: wait until it stands still.
  let camera = '';
  while (camera !== (camera = present(await canvas.getAttribute('data-camera'), 'camera'))) {
    await page.waitForTimeout(500);
  }
  const { x, y, zoom } = cameraFrom(camera);
  for (let lift = 10; lift <= 160; lift += 6) {
    const at = worldToScreen(onFace(face, 0.5, lift), box.width, box.height, { x, y }, zoom);
    const point = { x: box.x + at.x, y: box.y + at.y };
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(50);
    if ((await canvas.getAttribute('data-pointer')) === `${kind}:${id}`) return point;
  }
  throw new Error(`The pointer never reached the ${kind} ${id}`);
}

test('the map gives the pointer to the square under it, and a click still opens it', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  await page.waitForTimeout(1000);
  const at = await pointAtSquare(page, 'booth', 'jedi4ever');
  await page.waitForTimeout(500);
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  // A drag plays with the square instead of opening it.
  await page.mouse.down();
  await page.mouse.move(at.x + 40, at.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  // Off the square, it has no pointer.
  await page.mouse.move(2, 2);
  await expect(canvas).toHaveAttribute('data-pointer', '');
  await pointAtSquare(page, 'booth', 'jedi4ever');
  await page.mouse.down();
  await page.mouse.up();
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  expect(problems).toEqual([]);
});

for (const viewport of [
  { width: 1200, height: 1000, touch: false },
  { width: 390, height: 844, touch: true },
]) {
  test(`inside a booth, its drawing gets the pointer and taps at ${viewport.width} wide`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ hasTouch: viewport.touch, viewport });
    const page = await context.newPage();
    const problems = watch(page);
    await page.goto('#/booth/jedi4ever');
    const frame = frameOf(page, 'booth', 'jedi4ever');
    await expect(frame).toHaveAttribute('data-state', 'ready');
    const canvas = page.locator('.map-canvas');
    await expect(canvas).toHaveAttribute('data-room', '0.50,0.85');
    const stage = await stageOf(page);
    if (viewport.touch) {
      await page.touchscreen.tap(stage.x + stage.w / 2, stage.y + stage.h / 3);
    } else {
      await page.mouse.move(stage.x + stage.w / 2, stage.y + stage.h / 3);
      await expect(canvas).toHaveAttribute('data-pointer', 'booth:jedi4ever');
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.up();
      // Off the stage, the booth has no pointer.
      await page.mouse.move(stage.x - 20, stage.y + stage.h / 2);
      await expect(canvas).toHaveAttribute('data-pointer', '');
    }
    await page.waitForTimeout(500);
    // Playing with the drawing leaves the player where they stood, inside.
    await expect(canvas).toHaveAttribute('data-room', '0.50,0.85');
    await expect(frame).toHaveAttribute('data-state', 'ready');
    expect(problems).toEqual([]);
    await context.close();
  });
}
