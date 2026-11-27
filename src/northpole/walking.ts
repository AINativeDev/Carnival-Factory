/**
 * Walking a world step by step: where a walker can stand, moving them with
 * the arrow keys and along a planned walk, which spot's door they're at, and
 * the elves strolling about on their own. Plain functions, so the map moves
 * the player and the tests check it the same way. Planning a walk is in
 * `pathfinding.ts`.
 */
import { key, type Spot, type Stroll, type Tile, type World } from './world';

/** Whether you can stand on the tile at (x, y). */
export function walkable(world: World, x: number, y: number): boolean {
  return (
    Math.abs(x) <= world.extent && Math.abs(y) <= world.extent && !world.blocked.has(key(x, y))
  );
}

/** The tile a position is on. */
export const tileOf = (position: Tile): Tile => ({
  x: Math.round(position.x),
  y: Math.round(position.y),
});

/** How far a walker reaches from their middle, in tiles. */
const BODY = 0.2;

/** Whether a walker can stand at `position`, their body clear of anything blocked. */
export function canStand(world: World, position: Tile): boolean {
  for (const dx of [-BODY, BODY])
    for (const dy of [-BODY, BODY])
      if (!walkable(world, Math.round(position.x + dx), Math.round(position.y + dy))) return false;
  return true;
}

/**
 * Where a walker at `position` can stand: there, if they can, else the middle
 * of the nearest tile they can stand on, such as when the world was rebuilt
 * with something new where they stood.
 */
export function nearestStand(world: World, position: Tile): Tile {
  if (canStand(world, position)) return position;
  const { x, y } = tileOf(position);
  for (let ring = 1; ring <= 2 * world.extent + 1; ring++) {
    let best: Tile | undefined;
    for (let dx = -ring; dx <= ring; dx++)
      for (let dy = -ring; dy <= ring; dy++) {
        // Only the ring itself: every tile inside it already failed in an earlier ring.
        // Stryker disable next-line ConditionalExpression: trying the inner tiles again finds nothing new
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const tile = { x: x + dx, y: y + dy };
        if (!canStand(world, tile)) continue;
        if (!best || Math.hypot(dx, dy) < Math.hypot(best.x - x, best.y - y)) best = tile;
      }
    if (best) return best;
  }
  return { ...world.start };
}

/**
 * Moves a walker by (dx, dy) tiles, stopping at anything blocked. When the way
 * is blocked they slide along it, as far as either half of the move allows.
 */
export function moveBy(world: World, position: Tile, dx: number, dy: number): Tile {
  for (const next of [
    { x: position.x + dx, y: position.y + dy },
    { x: position.x + dx, y: position.y },
    { x: position.x, y: position.y + dy },
  ]) {
    if ((next.x !== position.x || next.y !== position.y) && canStand(world, next)) return next;
  }
  return position;
}

/**
 * The direction, in tiles, that arrow keys point on screen: `right` and `down`
 * are each -1, 0 or 1. Up the screen is north-west in tiles. The direction has
 * length 1, or 0 when the keys cancel out.
 */
export function screenDirection(right: number, down: number): Tile {
  const x = right + down;
  const y = down - right;
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

/**
 * Takes a walker `distance` tiles along `path`, dropping the tiles they reach.
 * Returns where they are and what is left of the path.
 */
export function walkAlong(
  position: Tile,
  path: readonly Tile[],
  distance: number,
): { position: Tile; path: Tile[] } {
  let at = position;
  let left = distance;
  const rest = [...path];
  for (let next = rest.at(0); next && left > 0; next = rest.at(0)) {
    const gap = Math.hypot(next.x - at.x, next.y - at.y);
    if (gap <= left) {
      at = { ...next };
      left -= gap;
      rest.shift();
    } else {
      at = { x: at.x + ((next.x - at.x) * left) / gap, y: at.y + ((next.y - at.y) * left) / gap };
      left = 0;
    }
  }
  return { position: at, path: rest };
}

/** The spot whose door a walker at `position` is standing at, if any. */
export function spotAtDoor(world: World, position: Tile): Spot | undefined {
  let best: Spot | undefined;
  let nearest = 0.75;
  for (const spot of world.spots) {
    const gap = Math.hypot(spot.door.x - position.x, spot.door.y - position.y);
    if (gap < nearest) [best, nearest] = [spot, gap];
  }
  return best;
}

/** A visitor's place on their stroll at `time`: walking there and back at an easy pace. */
export function strollAt(stroll: Stroll, time: number): Tile & { facing: number } {
  const length = Math.hypot(stroll.to.x - stroll.from.x, stroll.to.y - stroll.from.y) || 1;
  const pace = 0.0012 * (0.7 + 0.6 * stroll.seed);
  const travelled = (time * pace + stroll.seed * 2 * length) % (2 * length);
  const back = travelled > length;
  const along = (back ? 2 * length - travelled : travelled) / length;
  return {
    x: stroll.from.x + (stroll.to.x - stroll.from.x) * along,
    y: stroll.from.y + (stroll.to.y - stroll.from.y) * along,
    facing: back ? -1 : 1,
  };
}
