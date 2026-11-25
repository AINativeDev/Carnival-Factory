/**
 * The visitor's skater on Frozen Pond, as plain functions: it glides after the
 * pointer, carves a trail that fades, spins on a tap and earns a sparkle for a
 * figure eight. A `Rink` is the attraction's one memory between frames: kept
 * small (a capped trail and a few numbers), and every movement still timed
 * from `time`.
 */

/** The ice, in the attraction's 0 to 100 units: an oval round (52, 70). */
export const ICE = { x: 52, y: 70, across: 29, down: 12.5 };
/** How fast the skater glides, in units a second. */
export const SPEED = 32;
/** How long a carved line takes to fade from the ice, in milliseconds. */
export const FADE = 4_000;
/** How long a spin lasts, in milliseconds. */
export const SPIN = 1_200;
/** How long a figure eight's sparkle lasts, in milliseconds. */
export const SPARKLE = 1_600;
/** How far the skater turns one way, in radians, to have made one loop of an eight. */
const LOOP = Math.PI * 1.2;
/** How far the skater goes before the trail gets its next point. */
const STEP = 1.5;
/** The most points of trail the rink keeps: a full speed's worth, so the cap never cuts a line before it has faded. */
export const TRAIL = Math.ceil((SPEED * FADE) / 1000 / STEP) + 1;
/** The longest frame the skater moves for at once, so a hidden tab doesn't jump it. */
const LONGEST_FRAME = 100;

export interface Mark {
  x: number;
  y: number;
  at: number;
}

export interface Rink {
  x: number;
  y: number;
  /** Which way the skater faces, in radians. */
  heading: number;
  trail: Mark[];
  /** How far the skater has turned since its last loop, positive one way, negative the other. */
  turn: number;
  /** Which way its last loop went: 1, -1, or 0 for none yet. */
  lastLoop: number;
  spunAt: number;
  sparkledAt: number;
  then: number | undefined;
}

export function startRink(): Rink {
  return {
    x: ICE.x,
    y: ICE.y,
    heading: 0,
    trail: [],
    turn: 0,
    lastLoop: 0,
    spunAt: -Infinity,
    sparkledAt: -Infinity,
    then: undefined,
  };
}

/** The point on the ice's edge straight toward its middle from (x, y): a point on the ice stays where it is. */
export function onIce(x: number, y: number): { x: number; y: number } {
  const dx = (x - ICE.x) / ICE.across;
  const dy = (y - ICE.y) / ICE.down;
  const reach = Math.hypot(dx, dy);
  if (reach <= 1) return { x, y };
  return { x: ICE.x + (dx / reach) * ICE.across, y: ICE.y + (dy / reach) * ICE.down };
}

/** The turn from one heading to the next, the short way round. */
export function turnBetween(from: number, to: number): number {
  const turn = (to - from) % (Math.PI * 2);
  if (turn > Math.PI) return turn - Math.PI * 2;
  if (turn < -Math.PI) return turn + Math.PI * 2;
  return turn;
}

/** Counts the turn the skater just made: a loop one way after a loop the other is a figure eight. */
function countTurn(rink: Rink, turn: number, time: number): Rink {
  const total = rink.turn + turn;
  // Turning on the way the last loop went only finishes that loop: it never counts against the next.
  if (Math.sign(total) === rink.lastLoop) return { ...rink, turn: 0 };
  if (Math.abs(total) < LOOP) return { ...rink, turn: total };
  const loop = Math.sign(total);
  const eight = rink.lastLoop === -loop;
  return {
    ...rink,
    turn: 0,
    lastLoop: eight ? 0 : loop,
    sparkledAt: eight ? time : rink.sparkledAt,
  };
}

/**
 * The rink at `time`, with the skater glided toward `target` (kept on the ice),
 * a spin begun for any `presses`, and the trail's faded points dropped. A
 * spinning skater turns on the spot: it glides on once the spin is over.
 */
export function skate(
  rink: Rink,
  target: { x: number; y: number },
  time: number,
  presses: number,
): Rink {
  const frame = Math.min(Math.max(time - (rink.then ?? time), 0), LONGEST_FRAME);
  const goal = onIce(target.x, target.y);
  const away = Math.hypot(goal.x - rink.x, goal.y - rink.y);
  const spunAt = presses > 0 ? time : rink.spunAt;
  const glide = time - spunAt < SPIN ? 0 : Math.min(away, (SPEED * frame) / 1000);
  let next: Rink = { ...rink, then: time, spunAt };
  if (glide > 0) {
    next = {
      ...next,
      x: rink.x + ((goal.x - rink.x) / away) * glide,
      y: rink.y + ((goal.y - rink.y) / away) * glide,
    };
  }
  const last = next.trail.at(-1);
  if (!last || Math.hypot(next.x - last.x, next.y - last.y) >= STEP) {
    const heading = last ? Math.atan2(next.y - last.y, next.x - last.x) : next.heading;
    if (last) next = countTurn(next, turnBetween(next.heading, heading), time);
    next = { ...next, heading, trail: [...next.trail, { x: next.x, y: next.y, at: time }] };
  }
  return { ...next, trail: unfaded(next.trail, time) };
}

/** The trail's points that haven't faded yet, at most `TRAIL` of them. */
function unfaded(trail: readonly Mark[], time: number): Mark[] {
  return trail.filter((mark) => time - mark.at < FADE).slice(-TRAIL);
}

/**
 * The rink while nobody steers. Until a visitor first steers it, the skater
 * stands at `lane`, where the lane puts it from `time` alone; after, it waits
 * where it was left while its trail fades. Either way it counts no turns, so a
 * figure eight only ever sparkles for the visitor's own skating.
 */
export function rest(rink: Rink, lane: { x: number; y: number }, time: number): Rink {
  if (rink.then === undefined) return { ...rink, x: lane.x, y: lane.y };
  return { ...rink, then: time, trail: unfaded(rink.trail, time) };
}

/** How far into its spin the skater is, from 0 to 1, or undefined when it isn't spinning. */
export function spinning(rink: Rink, time: number): number | undefined {
  const into = (time - rink.spunAt) / SPIN;
  return into >= 0 && into < 1 ? into : undefined;
}

/** How bright the figure eight's sparkle is, from 1 as it's earned down to 0 once it's gone. */
export function sparkle(rink: Rink, time: number): number {
  const into = (time - rink.sparkledAt) / SPARKLE;
  return into >= 0 && into < 1 ? 1 - into : 0;
}
