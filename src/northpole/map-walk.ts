/**
 * The player walking: with the keys or along a planned path round the
 * carnival, leaving footprints on the way to a plot, and inside a room toward
 * where a click sent them and out through its doorway. Kept apart from the
 * drawing, since it's the one part of a frame that moves the player.
 */
import { ROOM_SPEED, stepInRoom } from './interior';
import type { MapRun } from './map-state';
import {
  findPathToFirst,
  moveBy,
  plotAtDoor,
  screenDirection,
  tileOf,
  toScreen,
  walkAlong,
  type Tile,
} from './world';

/** How fast the player walks, in tiles a second. */
const SPEED = 4.5;
/** How far apart footprints are, in tiles. */
const FOOTPRINT_GAP = 0.45;

/** The keys that walk, and which way each goes on screen. */
export const KEYS: Partial<Record<string, [number, number]>> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
};

/** Moves the player on for `dt` seconds, with the keys held or along their path. */
export function walk(m: MapRun, dt: number) {
  let right = 0;
  let down = 0;
  for (const [x, y] of m.held.values()) {
    right += x;
    down += y;
  }
  if (m.visiting) {
    walkInside(m, dt, Math.sign(right), Math.sign(down));
    return;
  }
  const direction = screenDirection(Math.sign(right), Math.sign(down));
  const before = m.player;
  if (direction.x || direction.y) {
    m.path = [];
    m.player = moveBy(m.world, m.player, direction.x * SPEED * dt, direction.y * SPEED * dt);
  } else if (m.path.length) {
    ({ position: m.player, path: m.path } = walkAlong(m.player, m.path, SPEED * dt));
  }
  m.moving = m.player !== before;
  const dx = toScreen(m.player).x - toScreen(before).x;
  if (Math.abs(dx) > 0.01) m.facing = Math.sign(dx);
  m.near = plotAtDoor(m.world, m.player);
  // The trail ends once the player arrives at the picked square's door.
  if (m.trailing && !m.path.length) m.trailing = false;
  if (m.claiming || m.trailing) leaveFootprints(m, before);
}

/** Leaves a footprint each step on the way to a plot, until the player goes somewhere else. */
function leaveFootprints(m: MapRun, before: Tile) {
  const lastStep = m.footprints.at(-1)?.at ?? before;
  const { player } = m;
  if (m.moving && Math.hypot(player.x - lastStep.x, player.y - lastStep.y) >= FOOTPRINT_GAP)
    m.footprints.push({
      at: { ...player },
      time: performance.now(),
      side: m.footprints.length % 2,
    });
  // The sign stops bouncing once the player has gone somewhere else.
  if (!m.path.length && m.near !== m.claiming) m.claiming = undefined;
}

/** Walks the player inside a room, with the keys or toward where a click sent them, and out through its doorway. */
function walkInside(m: MapRun, dt: number, right: number, down: number) {
  let dx = right;
  let dy = down;
  if (dx || dy) m.insideGoal = undefined;
  else if (m.insideGoal) {
    dx = m.insideGoal.to.x - m.inside.x;
    dy = m.insideGoal.to.y - m.inside.y;
  }
  const length = Math.hypot(dx, dy);
  const step = Math.min(ROOM_SPEED * dt, length);
  m.moving = length > 0.001 && step > 0;
  if (!m.moving) {
    m.insideGoal = undefined;
    return;
  }
  if (Math.abs(dx) > 0.001) m.insideFacing = Math.sign(dx);
  const walked = stepInRoom(m.inside, (dx / length) * step, (dy / length) * step);
  m.inside = walked.at;
  if (walked.out || (m.insideGoal?.out && step >= length)) {
    m.insideGoal = undefined;
    m.options.onLeave();
  }
}

/** Walks the player to the first of `goals` they can reach. */
export function walkToward(m: MapRun, goals: Tile[]) {
  // The walk starts by stepping to the middle of the player's own tile, so it
  // keeps clear of whatever is beside them, the way the keys do.
  const from = tileOf(m.player);
  const way = findPathToFirst(m.world, from, goals);
  if (way) m.path = [from, ...way];
}
