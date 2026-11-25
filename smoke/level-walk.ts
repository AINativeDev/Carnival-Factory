import { expect, type Page } from '@playwright/test';
import { worldToScreen } from '../src/northpole/camera-view';
import { findPath } from '../src/northpole/pathfinding';
import { canStand } from '../src/northpole/walking';
import { type Plot, type Tile, toScreen, type World } from '../src/northpole/world';

/**
 * Walking a level's player to a door in a real browser, for
 * smoke/levels.spec.ts. The camera comes in on the player while they walk and
 * rests there for a while after (`SETTLE` in src/northpole/map.ts), so the
 * next door can be off the canvas when the walk starts: the walk goes in
 * steps, each to the furthest tile on its way that is on the canvas and
 * clear of every structure, or to a detour when none of them is.
 */

/** How far inside the canvas's edges a step's click lands, clear of the HUD. */
const EDGE = 40;

/** How many steps a walk to one door may take before it gives up, counting steps planned again. */
const MOST_STEPS = 16;

/** Waits until the camera stands still, and says where it is, with `at` as the canvas reads it. Gives up after 15 seconds. */
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
  return { x, y, zoom, at: camera };
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
 * Whether a click at `position` would open a square or take a sleigh rather
 * than walk: the map opens whatever structure is under a click before it walks
 * (`onClick` in src/northpole/map.ts), and a structure stands taller than its
 * own tiles, so ground just behind it can be under it on screen. The map shows
 * the pointer cursor over exactly those, so hovering there first tells. A
 * point under something over the map, such as the call to action bobbing over
 * the door the player stands at, can't be hovered or clicked at all, so it
 * counts as taken too: on a slow machine the walk otherwise waits there.
 */
async function opensSomething(page: Page, position: { x: number; y: number }) {
  const canvas = page.locator('.map-canvas');
  const covered = await canvas.evaluate((element, { x, y }) => {
    const box = element.getBoundingClientRect();
    return document.elementFromPoint(box.left + x, box.top + y) !== element;
  }, position);
  if (covered) return true;
  await canvas.hover({ position, timeout: 10_000 });
  return (await canvas.evaluate((element) => element.style.cursor)) === 'pointer';
}

/**
 * The tile on the canvas, clear of every structure, that is the fewest steps
 * from `beside` and fewer than `from` is, or undefined when there is none.
 * Hovers only as many tiles as it takes, nearest first.
 */
async function detour(
  page: Page,
  world: World,
  from: Tile,
  beside: Tile,
  screenOf: (tile: Tile) => { x: number; y: number } | undefined,
) {
  const stepsLeft = (tile: Tile) => findPath(world, tile, beside)?.length ?? Infinity;
  const most = stepsLeft(from);
  const tiles: { tile: Tile; left: number }[] = [];
  for (let x = -world.extent; x <= world.extent; x++)
    for (let y = -world.extent; y <= world.extent; y++) {
      const tile = { x, y };
      if (!canStand(world, tile) || !screenOf(tile)) continue;
      const left = stepsLeft(tile);
      if (left < most) tiles.push({ tile, left });
    }
  tiles.sort((a, b) => a.left - b.left);
  for (const { tile } of tiles) {
    const position = screenOf(tile);
    if (position && !(await opensSomething(page, position))) return tile;
  }
  return undefined;
}

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
  let next: Tile | undefined;
  for (const tile of [...(way ?? [])].reverse()) {
    if (!canStand(world, tile) || !onCanvas(screenOf(tile))) continue;
    if (await opensSomething(page, screenOf(tile))) continue;
    next = tile;
    break;
  }
  // When every tile of the way on the canvas is behind a structure, as on a
  // phone's close camera, a detour does: the clear tile nearest `beside`.
  next ??= await detour(page, world, from, beside, (tile) => {
    const position = screenOf(tile);
    return onCanvas(position) ? position : undefined;
  });
  expect(
    next,
    `a tile on the way from ${from.x}, ${from.y} to ${what} is on the canvas and clear of every structure, with the camera at ${camera.x}, ${camera.y}`,
  ).toBeDefined();
  if (!next) return;
  // Hovering the way takes time, and the camera pulls back once it has rested
  // (`SETTLE` in src/northpole/map.ts): a click planned on the old camera can
  // land on a stall and open it, so a camera that moved plans the step again.
  if ((await canvas.getAttribute('data-camera')) !== camera.at) return;
  await canvas.click({ position: screenOf(next), timeout: 10_000 });
  await page.waitForTimeout(300);
  // On a phone's close camera a click can still land on a stall and go inside:
  // leave, as a visitor would, and the next step plans again from the door.
  if ((await canvas.getAttribute('data-room')) !== null) {
    await page.keyboard.press('Escape');
    await expect(canvas).not.toHaveAttribute('data-room', /.*/);
    await canvas.focus();
  }
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
