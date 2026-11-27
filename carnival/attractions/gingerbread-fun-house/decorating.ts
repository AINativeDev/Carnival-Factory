/**
 * The leaning house and the treats stuck on it. The house leans and sways,
 * and wobbles hard when a wrong note cracks its icing, so a tap is turned back
 * onto the house before anything uses it, and a treat is kept where it landed
 * on the house, swaying with it. Each note echoed right sticks a gumdrop, an
 * icing swirl or a candy where it was tapped, in turn.
 */

/** The treats a right note sticks on, in turn. */
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

/** How long the house wobbles after a wrong note, in milliseconds. */
export const WOBBLE = 2_000;

/** One treat on the house: where on the house, which treat and colour, and when it was placed. */
export interface Decoration {
  x: number;
  y: number;
  treat: Treat;
  /** Which of the treat colours it takes, in turn. */
  tint: number;
  at: number;
}

/** Every treat on the house, and how many were ever placed. */
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

/**
 * How far the house turns `since` ms after a wrong note: a shudder about two
 * times a second that dies away. Before the note, and once it's over, none.
 */
export function wobble(since: number): number {
  if (since < 0 || since > WOBBLE) return 0;
  return 0.09 * Math.sin(since / 85) * (1 - since / WOBBLE) ** 2;
}

/** Where a point on the screen is on the house while it's turned `turn` radians. */
export function onHouse(x: number, y: number, turn: number): { x: number; y: number } {
  const back = -turn;
  const dx = x - LEAN_FROM.x;
  const dy = y - LEAN_FROM.y;
  return {
    x: LEAN_FROM.x + dx * Math.cos(back) - dy * Math.sin(back),
    y: LEAN_FROM.y + dx * Math.sin(back) + dy * Math.cos(back),
  };
}

/** The house with one more treat stuck at `x`, `y` on it at `time`, kept clear of the edges. */
export function decorate(house: Decorating, x: number, y: number, time: number): Decorating {
  const placed = [
    ...house.placed,
    {
      x: Math.min(100 - EDGE, Math.max(EDGE, x)),
      y: Math.min(100 - EDGE, Math.max(EDGE, y)),
      treat: TREATS[house.count % TREATS.length] ?? 'gumdrop',
      tint: house.count,
      at: time,
    },
  ];
  return { placed: placed.slice(-MOST), count: house.count + 1 };
}

/** How big a treat placed at `at` is drawn at `time`: it pops on a little too big, then settles. */
export function popScale(at: number, time: number): number {
  const t = Math.min(1, Math.max(0, (time - at) / POP));
  return t + 0.6 * Math.sin(Math.PI * t);
}
