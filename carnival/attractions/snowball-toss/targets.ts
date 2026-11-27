/**
 * The tin snowmen: the three shelves they slide along, how fast they slide in
 * each round, which one turns gold now and then for a bonus, and how one
 * tips over when hit and stands back up. Plain functions in the attraction's
 * 0 to 100 units, so the game is tested without a canvas.
 */

/** How long a knocked snowman lies down before it stands up again, in ms. */
export const DOWN = 1_800;
/** What a gold snowman scores before the combo. */
export const GOLD_POINTS = 5;
/** A snowman turns gold this often in a round, in ms… */
const GOLD_EVERY = 6_500;
/** …for this long… */
export const GOLD_FOR = 3_000;
/** …the first time this long after the round starts. */
const GOLD_FIRST = 2_500;

/** The three shelves, bottom to top: where a snowman's feet are, how far it slides, how fast, and what it scores. */
export const SHELVES = [
  { y: 63, swing: 18, period: 3_400, points: 1 },
  { y: 49, swing: 14, period: 2_400, points: 2 },
  { y: 35, swing: 10, period: 1_500, points: 3 },
] as const;

/** How much faster the snowmen slide in each round than in the first. */
const PACE = [1, 1.3, 1.65] as const;

/** How fast the snowmen slide in `round`, counted from 1. */
export const paceOf = (round: number) =>
  PACE.at(Math.min(PACE.length, Math.max(1, round)) - 1) ?? 1;

/** Where shelf `n`'s snowman stands across at `time`: sliding to and fro, each shelf at its own pace. */
export function snowmanX(n: number, time: number, pace = 1): number {
  const shelf = SHELVES.at(n);
  if (!shelf) return 50;
  return 50 + Math.sin((time / shelf.period) * pace * Math.PI * 2 + n * 2) * shelf.swing;
}

/**
 * The shelf whose snowman is gold at `time`, in a round started at
 * `roundStart`, or -1 while none is. Each turn goes to the next shelf up.
 */
export function goldShelf(roundStart: number, round: number, time: number): number {
  const since = time - roundStart - GOLD_FIRST;
  if (since < 0) return -1;
  const turn = Math.floor(since / GOLD_EVERY);
  if (since - turn * GOLD_EVERY >= GOLD_FOR) return -1;
  return (turn + round) % SHELVES.length;
}

/** How far a snowman knocked down at `at` has tipped at `time`, from 0 (standing) to 1 (flat), and back up. */
export function topple(at: number | null | undefined, time: number): number {
  if (at === null || at === undefined) return 0;
  const t = time - at;
  if (t < 200) return Math.max(0, t / 200);
  if (t < DOWN - 400) return 1;
  return Math.max(0, (DOWN - t) / 400);
}
