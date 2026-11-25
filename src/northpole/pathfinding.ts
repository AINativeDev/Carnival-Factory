/**
 * Finding the way round a world: every tile a walker can reach, and the
 * shortest walk to a tile, stepping diagonally only where no corner is cut.
 * The map walks the player there after a click, and a level's check walks it
 * to prove every square and exit can be reached. It's apart from `walking.ts`,
 * which moves a walker step by step, because this plans the whole walk at once.
 */
import { walkable } from './walking';
import { key, type Tile, type World } from './world';

/** The eight ways a walker can step from a tile, straight before diagonal. */
const STEPS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Whether a walker can step from tile (x, y) by (dx, dy), cutting no corner. */
const canStep = (world: World, x: number, y: number, dx: number, dy: number) =>
  walkable(world, x + dx, y + dy) &&
  (!dx || !dy || (walkable(world, x + dx, y) && walkable(world, x, y + dy)));

/** Every tile a walker can reach from tile `from`. */
export function reachable(world: World, from: Tile): Set<string> {
  const seen = new Set([key(from.x, from.y)]);
  const queue = [from];
  // The queue grows as it's walked, and `for...of` walks on into what's added.
  for (const { x, y } of queue) {
    for (const [dx, dy] of STEPS) {
      const there = key(x + dx, y + dy);
      if (seen.has(there) || !canStep(world, x, y, dx, dy)) continue;
      seen.add(there);
      queue.push({ x: x + dx, y: y + dy });
    }
  }
  return seen;
}

/**
 * The shortest walk from tile `from` to the first of `goals` a walker can
 * reach, or undefined when they can reach none. However many goals there are,
 * it searches the world at most three times.
 */
export function findPathToFirst(
  world: World,
  from: Tile,
  goals: readonly Tile[],
): Tile[] | undefined {
  const open = goals.filter((goal) => walkable(world, goal.x, goal.y));
  const first = open.at(0);
  if (!first) return undefined;
  const way = findPath(world, from, first);
  if (way || open.length === 1) return way;
  const reach = reachable(world, from);
  const goal = open.find((goal) => reach.has(key(goal.x, goal.y)));
  return goal && findPath(world, from, goal);
}

/** A tile waiting to be tried: its cost so far plus the guess to go, and where it is. */
type Waiting = [score: number, x: number, y: number];

/** Adds a tile to the heap of tiles waiting, the lowest score on top. */
function pushWaiting(heap: Waiting[], item: Waiting): void {
  let i = heap.length;
  heap.push(item);
  while (i > 0) {
    const parent = (i - 1) >> 1;
    const above = heap.at(parent);
    if (!above || above[0] <= item[0]) break;
    heap[i] = above;
    i = parent;
  }
  heap[i] = item;
}

/** Takes the tile with the lowest score off the heap, or undefined when none is left. */
function popWaiting(heap: Waiting[]): Waiting | undefined {
  const top = heap.at(0);
  const last = heap.pop();
  if (!last || !heap.length) return top;
  let i = 0;
  for (;;) {
    let least = last;
    let at = i;
    for (const child of [2 * i + 1, 2 * i + 2]) {
      const there = heap.at(child);
      if (there && there[0] < least[0]) [least, at] = [there, child];
    }
    if (at === i) break;
    heap[i] = least;
    i = at;
  }
  heap[i] = last;
  return top;
}

/** The walk that led to `to`, from the step after `from`, following where each tile came from. */
function walkBack(came: ReadonlyMap<string, Tile>, from: Tile, to: Tile): Tile[] {
  const path: Tile[] = [];
  const start = key(from.x, from.y);
  for (let at: Tile | undefined = to; at && key(at.x, at.y) !== start;) {
    path.unshift(at);
    at = came.get(key(at.x, at.y));
  }
  return path;
}

/**
 * The shortest walk from tile `from` to tile `to`, as the tiles after `from`,
 * or undefined when `to` can't be reached. Walkers step diagonally only where
 * neither tile beside the corner is blocked.
 */
export function findPath(world: World, from: Tile, to: Tile): Tile[] | undefined {
  if (!walkable(world, to.x, to.y)) return undefined;
  if (from.x === to.x && from.y === to.y) return [];
  const cost = new Map<string, number>([[key(from.x, from.y), 0]]);
  const came = new Map<string, Tile>();
  const guess = (x: number, y: number) => {
    const [a, b] = [Math.abs(x - to.x), Math.abs(y - to.y)];
    return Math.max(a, b) + (Math.SQRT2 - 1) * Math.min(a, b);
  };
  const heap: Waiting[] = [[guess(from.x, from.y), from.x, from.y]];
  for (let next = popWaiting(heap); next; next = popWaiting(heap)) {
    const [, x, y] = next;
    // A tile waits only once it has a cost, so this is always a number. It's
    // the tile's best cost now, not when it started waiting: a tile that waits
    // twice steps on from its best, which keeps every walk the same as before.
    const sofar = Number(cost.get(key(x, y)));
    if (x === to.x && y === to.y) return walkBack(came, from, to);
    for (const [dx, dy] of STEPS) {
      if (!canStep(world, x, y, dx, dy)) continue;
      const there = key(x + dx, y + dy);
      const step = sofar + (dx && dy ? Math.SQRT2 : 1);
      if (step >= (cost.get(there) ?? Infinity)) continue;
      cost.set(there, step);
      came.set(there, { x, y });
      pushWaiting(heap, [step + guess(x + dx, y + dy), x + dx, y + dy]);
    }
  }
  return undefined;
}
