/**
 * Decorating the house: each tap sticks a treat where it lands, a gumdrop, an
 * icing swirl and a candy in turn. The house leans and sways, so a treat is
 * kept where it landed on the house, not on the screen, and sways with it.
 * What the house remembers is these few treats and how many were placed.
 */

/** The treats a tap places, in turn. */
export const TREATS = ['gumdrop', 'swirl', 'candy'] as const;
type Treat = (typeof TREATS)[number];

/** The most treats the house holds: past this, the oldest falls off for the newest. */
export const MOST = 24;

/** How long a treat takes to pop on, in milliseconds. */
export const POP = 320;

/**
 * How far a treat's middle keeps from the square's edges, on the house: its
 * glow at the top of its pop (about 4.2) and the most the house's sway can
 * carry it (about 5), so no part of it is ever cut off at the square's edge.
 */
export const EDGE = 10;

/** Where the house leans from: the middle of its front wall's foot, in the scene's 0 to 100 units. */
export const LEAN_FROM = { x: 40, y: 71 } as const;

/** One treat on the house: where on the house, which treat and colour, and when it was placed. */
export interface Decoration {
  x: number;
  y: number;
  treat: Treat;
  /** Which of the treat colours it takes, in turn. */
  tint: number;
  at: number;
}

/** Everything the house remembers between frames. */
export interface Decorating {
  placed: Decoration[];
  count: number;
}

/** The house before anyone decorates it. */
export const bare = (): Decorating => ({ placed: [], count: 0 });

/** How far the house leans at `time`, in radians: a slow sway, a little to the left. */
export function lean(time: number): number {
  return Math.sin(time / 1500) * 0.03 - 0.03;
}

/** Where a point on the screen at `time` is on the house, undoing its lean. */
export function onHouse(x: number, y: number, time: number): { x: number; y: number } {
  const turn = -lean(time);
  const dx = x - LEAN_FROM.x;
  const dy = y - LEAN_FROM.y;
  return {
    x: LEAN_FROM.x + dx * Math.cos(turn) - dy * Math.sin(turn),
    y: LEAN_FROM.y + dx * Math.sin(turn) + dy * Math.cos(turn),
  };
}

/**
 * The house after `presses` taps at (x, y) on the screen at `time`. Taps that
 * came between two frames land in a little ring round the spot, so each shows.
 */
export function decorate(
  house: Decorating,
  x: number,
  y: number,
  time: number,
  presses: number,
): Decorating {
  const placed = [...house.placed];
  let count = house.count;
  for (let n = 0; n < presses; n++) {
    const spot = onHouse(
      x + Math.cos(n * 2.4) * 3 * Math.sign(n),
      y + Math.sin(n * 2.4) * 3 * Math.sign(n),
      time,
    );
    placed.push({
      x: Math.min(100 - EDGE, Math.max(EDGE, spot.x)),
      y: Math.min(100 - EDGE, Math.max(EDGE, spot.y)),
      treat: TREATS[count % TREATS.length] ?? 'gumdrop',
      tint: count,
      at: time,
    });
    count += 1;
  }
  return { placed: placed.slice(-MOST), count };
}

/** How big a treat placed at `at` is drawn at `time`: it pops on a little too big, then settles. */
export function popScale(at: number, time: number): number {
  const t = Math.min(1, Math.max(0, (time - at) / POP));
  return t + 0.6 * Math.sin(Math.PI * t);
}
