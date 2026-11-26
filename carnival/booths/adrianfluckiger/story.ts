/**
 * The story of Santa's line, as a pure function of time: which child is on
 * Santa's lap, where the elf, the carrot and the queue are. One child's visit
 * takes a whole turn of `TURN_SECONDS`, and the next child's begins right after.
 */

/** Seconds one child's visit lasts, from the elf fetching them to them leaving. */
export const TURN_SECONDS = 12;

/** Where things stand on the 0 to 100 diorama. */
export const SPOTS = {
  elfHome: 68,
  queueHead: 82,
  queueGap: 7,
  lap: 52,
  reindeer: 28,
  exit: -10,
  ground: 78,
  lapHeight: 60,
} as const;

/** A child in the scene: which one, where, and whether they sit on Santa's lap. */
export interface ChildAt {
  index: number;
  x: number;
  y: number;
  sitting: boolean;
}

/** Everything that moves, at one moment. */
export interface Moment {
  elfX: number;
  elfLeading: boolean;
  child: ChildAt;
  waiting: ChildAt[];
  carrot: { x: number; y: number } | undefined;
  /** 0 to 1: how far into munching the reindeer is. */
  munch: number;
}

/** Position `amount` of the way from `from` to `to`, `amount` clamped to 0 to 1. */
export function lerp(from: number, to: number, amount: number): number {
  const t = Math.min(1, Math.max(0, amount));
  return from + (to - from) * t;
}

/** Progress through a stretch from `start` to `end` seconds, from 0 to 1. */
export function between(seconds: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (seconds - start) / (end - start)));
}

/** Every fourth child, from the third, arrives with a family dog trotting behind. */
export function hasDog(index: number): boolean {
  return index % 4 === 2;
}

/** Where child `turn` is in their own visit, `seconds` into the turn. */
function childIn(index: number, seconds: number): ChildAt {
  const { queueHead, lap, reindeer, exit, ground, lapHeight } = SPOTS;
  const sitting = seconds >= 4.5 && seconds < 8.5;
  if (seconds < 2.5) return { index, x: queueHead, y: ground, sitting: false };
  if (seconds < 4.5) {
    const walk = between(seconds, 2.5, 4.5);
    return { index, x: lerp(queueHead, lap, walk), y: lerp(ground, lapHeight, walk), sitting };
  }
  if (sitting) return { index, x: lap, y: lapHeight, sitting };
  if (seconds < 10.5) {
    const walk = between(seconds, 8.5, 10.5);
    return { index, x: lerp(lap, reindeer + 9, walk), y: lerp(lapHeight, ground, walk), sitting };
  }
  return { index, x: lerp(reindeer + 9, exit, between(seconds, 10.5, 12)), y: ground, sitting };
}

/** The elf's place: out to the queue, back with the child, then home. */
function elfAt(seconds: number): { x: number; leading: boolean } {
  const { elfHome, queueHead, lap } = SPOTS;
  if (seconds < 2.5)
    return { x: lerp(elfHome, queueHead, between(seconds, 0, 2.5)), leading: false };
  if (seconds < 4.5)
    return { x: lerp(queueHead, lap + 9, between(seconds, 2.5, 4.5)), leading: true };
  return { x: lerp(lap + 9, elfHome, between(seconds, 4.5, 5.5)), leading: false };
}

/** The carrot Santa hands over as a child hops down: in flight from his hand to the reindeer. */
function carrotAt(seconds: number): Moment['carrot'] {
  if (seconds < 8.5 || seconds >= 10) return undefined;
  const flight = between(seconds, 8.5, 10);
  return {
    x: lerp(SPOTS.lap - 4, SPOTS.reindeer + 4, flight),
    y: SPOTS.lapHeight - 4 - Math.sin(flight * Math.PI) * 8 + flight * 14,
  };
}

/** The children waiting after `turn`'s child, shuffling forward once the elf has fetched theirs. */
function queueAfter(turn: number, seconds: number): ChildAt[] {
  const { queueHead, queueGap, ground } = SPOTS;
  const shuffle = 1 - between(seconds, 4.5, 6);
  return [1, 2, 3].map((k) => ({
    index: turn + k,
    x: queueHead + (k - 1 + shuffle) * queueGap,
    y: ground,
    sitting: false,
  }));
}

/** The whole scene `timeMs` milliseconds in. */
export function momentAt(timeMs: number): Moment {
  const turns = Math.max(0, timeMs) / 1000 / TURN_SECONDS;
  const turn = Math.floor(turns);
  const seconds = (turns - turn) * TURN_SECONDS;
  const elf = elfAt(seconds);
  return {
    elfX: elf.x,
    elfLeading: elf.leading,
    child: childIn(turn, seconds),
    waiting: queueAfter(turn, seconds),
    carrot: carrotAt(seconds),
    munch: between(seconds, 9.5, 11),
  };
}
