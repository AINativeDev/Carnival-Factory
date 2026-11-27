import { expect, test, type Page } from './coverage';
import { worldToScreen } from '../src/northpole/camera-view';
import { faceOf, onFace } from '../src/northpole/faces';
import { booths, carnivalWorld, frameOf, present, watch } from './support/carnival';
import { boxOf, cameraFrom, stageOf } from './support/map-canvas';
import { STALL } from '../src/northpole/stall-plan';

/**
 * Hover and taps reaching a square: on the map through its stall's front,
 * where a click still goes inside, and inside on the back wall, with a mouse
 * and with a finger at phone width, and playing the Gingerbread Fun House
 * from inside. Apart from the visit tests because these
 * aim the pointer at a square's drawing rather than walk the player.
 */

/** Where across a stall's front, and how far up its drawing, the pointer is tried: the middle first. */
const ALONG = [0.5, 0.3, 0.7];
const UP = [0.5, 0.25, 0.75];

/**
 * Moves the mouse over a booth's drawing on its stall's front, the middle
 * first, until the map gives that booth the pointer, and says where on the
 * page that was, or undefined when it never did: another stall standing in
 * front of it on screen takes the pointer there, as it should. Every stall
 * shape hangs the drawing the same way (`stallFront` in
 * src/northpole/stall-front.ts): `STALL.art` up its front and as tall as 84%
 * of the front is wide. A point under a panel over the map, such as the Booths
 * panel, never reaches the canvas, so it's passed over without a try.
 */
async function pointAtSquare(page: Page, id: string) {
  const canvas = page.locator('.map-canvas');
  const spot = present(
    carnivalWorld().spots.find((p) => p.kind === 'booth' && p.id === id),
    `spot of the booth ${id}`,
  );
  const box = await boxOf(canvas);
  const face = faceOf(spot);
  const tall = Math.abs(face.b.x - face.a.x) * 0.84;
  // The camera eases out a while after the player stops: wait until it stands still.
  let camera = '';
  while (camera !== (camera = present(await canvas.getAttribute('data-camera'), 'camera'))) {
    await page.waitForTimeout(500);
  }
  const { x, y, zoom } = cameraFrom(camera);
  const points = ALONG.flatMap((along) =>
    UP.map((up) => {
      const lift = STALL.art + tall * up;
      const at = worldToScreen(onFace(face, along, lift), box.width, box.height, { x, y }, zoom);
      return { x: box.x + at.x, y: box.y + at.y };
    }),
  );
  const open = await canvas.evaluate(
    (element, all) => all.map(({ x: px, y: py }) => document.elementFromPoint(px, py) === element),
    points,
  );
  for (const [n, point] of points.entries()) {
    if (!open[n]) continue;
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(100);
    if ((await canvas.getAttribute('data-pointer')) === `booth:${id}`) return point;
  }
  return undefined;
}

/**
 * Shows booths on the map one by one, jedi4ever's first, until one's drawing
 * takes the pointer, and says which and where. A booth added later can stand
 * in front of another on screen and hide its whole front, as Penguin Slide's
 * kiosk did jedi4ever's cabin, so the test doesn't hang on any one booth.
 */
async function aimAtSomeBooth(page: Page) {
  const tried = ['jedi4ever', ...booths.filter((id) => id !== 'jedi4ever')].slice(0, 6);
  for (const id of tried) {
    await page.goto(`#/?booth=${id}`);
    await expect(frameOf(page, 'booth', id)).toHaveAttribute('data-state', 'ready');
    await page.waitForTimeout(1000);
    const at = await pointAtSquare(page, id);
    if (at) return { id, at };
  }
  throw new Error(`The pointer never reached any of the booths ${tried.join(', ')}`);
}

test('the map gives the pointer to the square under it, and a click still opens it', async ({
  page,
}) => {
  // Each booth tried is a page load, its frame opening and a handful of moves:
  // a slow runner's software drawing takes several seconds a booth.
  test.setTimeout(150_000);
  const problems = watch(page);
  const canvas = page.locator('.map-canvas');
  const { id, at } = await aimAtSomeBooth(page);
  await page.waitForTimeout(500);
  await expect(frameOf(page, 'booth', id)).toHaveAttribute('data-state', 'ready');
  // A drag plays with the square instead of opening it. It pans the map too, so
  // it drags toward the middle, keeping the square clear of the panels at the sides.
  const box = await boxOf(canvas);
  const toward = at.x > box.x + box.width / 2 ? -40 : 40;
  await page.mouse.down();
  await page.mouse.move(at.x + toward, at.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(new RegExp(`#/\\?booth=${id}$`));
  // Off the square, it has no pointer.
  await page.mouse.move(2, 2);
  await expect(canvas).toHaveAttribute('data-pointer', '');
  expect(await pointAtSquare(page, id), `the pointer back on ${id}`).toBeDefined();
  await page.mouse.down();
  await page.mouse.up();
  await expect(page).toHaveURL(new RegExp(`#/booth/${id}$`));
  expect(problems).toEqual([]);
});

// The Sleigh-Ride Coaster too: a tap inside launches its sleigh.
for (const [viewport, kind, id] of [
  { width: 1200, height: 1000, touch: false },
  { width: 390, height: 844, touch: true },
].flatMap((viewport) => [
  [viewport, 'booth', 'jedi4ever'] as const,
  [viewport, 'attraction', 'sleigh-coaster'] as const,
])) {
  test(`inside the ${kind} ${id}, its drawing gets the pointer and taps at ${viewport.width} wide`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ hasTouch: viewport.touch, viewport });
    const page = await context.newPage();
    const problems = watch(page);
    await page.goto(`#/${kind}/${id}`);
    const frame = frameOf(page, kind, id);
    await expect(frame).toHaveAttribute('data-state', 'ready');
    const canvas = page.locator('.map-canvas');
    await expect(canvas).toHaveAttribute('data-stage', /^\d+,\d+,\d+,\d+$/);
    const stage = await stageOf(page);
    if (viewport.touch) {
      await page.touchscreen.tap(stage.x + stage.w / 2, stage.y + stage.h / 3);
    } else {
      await page.mouse.move(stage.x + stage.w / 2, stage.y + stage.h / 3);
      await expect(canvas).toHaveAttribute('data-pointer', `${kind}:${id}`);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.up();
      // Off the stage, the booth has no pointer.
      await page.mouse.move(stage.x - 20, stage.y + stage.h / 2);
      await expect(canvas).toHaveAttribute('data-pointer', '');
    }
    await page.waitForTimeout(500);
    // Playing with the drawing keeps the visit inside.
    await expect(page.locator('.map-frame')).toHaveAttribute('data-visiting', `${kind}:${id}`);
    await expect(frame).toHaveAttribute('data-state', 'ready');
    expect(problems).toEqual([]);
    await context.close();
  });
}

for (const viewport of [
  { width: 1200, height: 1000, touch: false },
  { width: 390, height: 844, touch: true },
]) {
  test(`inside the Gingerbread Fun House, taps play its echo game at ${viewport.width} wide`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ hasTouch: viewport.touch, viewport });
    const page = await context.newPage();
    const problems = watch(page);
    await page.goto('#/attraction/gingerbread-fun-house');
    const frame = frameOf(page, 'attraction', 'gingerbread-fun-house');
    await expect(frame).toHaveAttribute('data-state', 'ready');
    const canvas = page.locator('.map-canvas');
    await expect(canvas).toHaveAttribute('data-stage', /^\d+,\d+,\d+,\d+$/);
    const room = await canvas.getAttribute('data-stage');
    const stage = await stageOf(page);
    // A few taps on the house: the first starts a game of Icing Echo, the rest play it.
    for (const [x, y] of [
      [0.35, 0.45],
      [0.45, 0.55],
      [0.6, 0.5],
    ] as const) {
      const at = { x: stage.x + stage.w * x, y: stage.y + stage.h * y };
      if (viewport.touch) {
        await page.touchscreen.tap(at.x, at.y);
      } else {
        await page.mouse.move(at.x, at.y);
        await expect(canvas).toHaveAttribute('data-pointer', 'attraction:gingerbread-fun-house');
        await page.mouse.down();
        await page.mouse.up();
      }
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(500);
    // Playing keeps the visit inside, and the house still drawing where it was.
    await expect(canvas).toHaveAttribute('data-stage', present(room, 'stage'));
    await expect(frame).toHaveAttribute('data-state', 'ready');
    expect(problems).toEqual([]);
    await context.close();
  });
}
