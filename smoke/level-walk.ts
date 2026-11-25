import { expect, type Page } from '@playwright/test';
import { worldToScreen } from '../src/northpole/camera';
import {
  canStand,
  findPath,
  toScreen,
  type Plot,
  type Tile,
  type World,
} from '../src/northpole/world';

/**
 * Walking a level's player to a door in a real browser, for
 * smoke/levels.spec.ts. The camera comes in on the player while they walk and
 * rests there for a while after (`SETTLE` in src/northpole/map.ts), so the
 * next door can be off the canvas when the walk starts: the walk goes in
 * steps, each to the furthest tile on its way that is on the canvas.
 */

/** How far inside the canvas's edges a step's click lands, clear of the HUD. */
const EDGE = 40;

/** How many steps a walk to one door may take before it gives up. */
const MOST_STEPS = 12;

/** Waits until the camera stands still, and says where it is. Gives up after 15 seconds. */
export async function stillCamera(page: Page) {
  const canvas = page.locator('.map-canvas');
  const until = Date.now() + 15_000;
  let camera = '';
  while (
    camera !== (camera = (await canvas.getAttribute('data-camera', { timeout: 5000 })) ?? '')
  ) {
    if (Date.now() > until) throw new Error(`the camera never stood still, last at ${camera}`);
    await page.waitForTimeout(400);
  }
  const [x = 0, y = 0, zoom = 1] = camera.split(',').map(Number);
  return { x, y, zoom };
}

/** Waits until the player stops walking, and says which tile they stand on. */
async function stillPlayer(page: Page): Promise<Tile> {
  const canvas = page.locator('.map-canvas');
  const until = Date.now() + 15_000;
  let at = '';
  while (at !== (at = (await canvas.getAttribute('data-player', { timeout: 5000 })) ?? '')) {
    if (Date.now() > until) throw new Error(`the player never stood still, last at ${at}`);
    await page.waitForTimeout(400);
  }
  const [x = 0, y = 0] = at.split(',').map(Number);
  return { x, y };
}

/**
 * The tiles beside a door the player can step onto it from, each with the
 * keys for that one step: from the east up and left on screen, from the south
 * up and right, and from the north down and left. West of a door is its stall.
 */
const APPROACHES: { dx: number; dy: number; keys: [string, string] }[] = [
  { dx: 1, dy: 0, keys: ['w', 'a'] },
  { dx: 0, dy: 1, keys: ['w', 'd'] },
  { dx: 0, dy: -1, keys: ['s', 'a'] },
];

/**
 * One step towards `beside`: a click on the furthest tile of the way there
 * that is on the canvas where the camera stands now, then a wait for the
 * player to stop. A camera that moved before the click only makes the step
 * land elsewhere, and the next step plans again from there.
 */
async function stepToward(page: Page, world: World, from: Tile, beside: Tile, what: string) {
  const canvas = page.locator('.map-canvas');
  const way = findPath(world, from, beside);
  expect(way, `a way from ${from.x}, ${from.y} to ${what}`).toBeDefined();
  const camera = await stillCamera(page);
  const box = await canvas.boundingBox();
  expect(box, 'the map is on the page').not.toBeNull();
  const { width, height } = box ?? { width: 0, height: 0 };
  const screenOf = (tile: Tile) =>
    worldToScreen(toScreen(tile), width, height, camera, camera.zoom);
  const onCanvas = ({ x, y }: Tile) =>
    x >= EDGE && y >= EDGE && x < width - EDGE && y < height - EDGE;
  const next = [...(way ?? [])]
    .reverse()
    .find((tile) => canStand(world, tile) && onCanvas(screenOf(tile)));
  expect(
    next,
    `a tile on the way from ${from.x}, ${from.y} to ${what} is on the canvas, with the camera at ${camera.x}, ${camera.y}`,
  ).toBeDefined();
  if (!next) return;
  await canvas.click({ position: screenOf(next), timeout: 10_000 });
  await page.waitForTimeout(300);
  await stillPlayer(page);
}

/**
 * Walks the player to a plot's door: in steps to the ground beside it, which
 * the map walks to, then a step onto the door. Clicking the door itself would
 * land on the stall in front of it. A player already on the door, such as one
 * who arrived there, stays put.
 */
export async function walkToDoor(page: Page, world: World, plot: Plot) {
  const canvas = page.locator('.map-canvas');
  const what = `${plot.kind} ${plot.id}'s door`;
  if ((await canvas.getAttribute('data-player')) === `${plot.door.x},${plot.door.y}`) {
    await expect(canvas).toHaveAttribute('data-near', `${plot.kind}:${plot.id}`);
    return;
  }
  const approach = APPROACHES.map(({ dx, dy, keys }) => ({
    beside: { x: plot.door.x + dx, y: plot.door.y + dy },
    keys,
  })).find(
    ({ beside }) => canStand(world, beside) && findPath(world, world.start, beside) !== undefined,
  );
  expect(approach, `a tile beside ${what} is clear`).toBeDefined();
  if (!approach) return;
  const { beside, keys } = approach;
  for (let step = 0; step < MOST_STEPS; step++) {
    const from = await stillPlayer(page);
    if (from.x === beside.x && from.y === beside.y) break;
    await stepToward(page, world, from, beside, `the tile beside ${what}`);
  }
  await expect(canvas).toHaveAttribute('data-player', `${beside.x},${beside.y}`);
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(200);
  for (const key of keys) await page.keyboard.up(key);
  await expect(canvas).toHaveAttribute('data-near', `${plot.kind}:${plot.id}`);
}
