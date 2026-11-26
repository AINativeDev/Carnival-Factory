/**
 * The audience: where every seat is, how each attendee looks, and what they're
 * doing at `time`: nodding along, a hand up to ask, cheering when they get the
 * mic, with the clap and the glow of their badges spreading out from there,
 * clapping in the next speaker, heads down when the room goes quiet, or the
 * whole hall on its feet for a standing ovation. All of it is worked out from
 * `time` and what the game remembers, in the attraction's 0 to 100 units.
 */
/** The rows, back (by the stage) to front: where the shoulders are, how big, and how many each side of the aisle. */
const ROWS = [
  { y: 61, s: 0.5, n: 7 },
  { y: 70, s: 0.66, n: 6 },
  { y: 80, s: 0.82, n: 5 },
  { y: 93, s: 1, n: 4 },
] as const;

/** The middle of the aisle, where the question mic stands. */
const AISLE = 50;

/** One seat in the hall, and the attendee in it. */
export interface Seat {
  x: number;
  y: number;
  /** How big an attendee in this row is drawn, 1 in the front row. */
  s: number;
  row: number;
  /** A number of its own, so each attendee looks and nods a little differently. */
  seed: number;
}

/** Every seat, back row first, so drawing them in order puts the nearer rows in front. */
export const SEATS: readonly Seat[] = ROWS.flatMap((row, r) => {
  const gap = 4 + 3 * row.s;
  const step = 12 * row.s;
  // The back rows sit a little off the front ones', so heads don't stack.
  const shift = r % 2 ? step * 0.3 : 0;
  return Array.from({ length: row.n * 2 }, (_, k) => {
    const side = k < row.n ? -1 : 1;
    const place = k % row.n;
    const x = AISLE + side * (gap + shift + step * (place + 0.5));
    return { x, y: row.y, s: row.s, row: r, seed: (r * 17 + k * 7) % 23 };
  });
});

/** Where an attendee's head is: what a tap aims at. */
export const headOf = (seat: Seat) => ({ x: seat.x, y: seat.y - 7 * seat.s });

/** An attendee who just got the mic for a good question: which seat, and when. */
export interface Cheer {
  seat: number;
  at: number;
}

/** How long an attendee who got the mic is up with their arms in the air. */
export const CHEER_FOR = 1_600;
/** How long the clap and badge glow last on an attendee the cheer reaches. */
const WAVE_FOR = 1_100;
/** How long the cheer takes to cross one unit of the hall. */
const WAVE_SPEED = 20;
/** How long the hall claps when the next speaker comes on. */
export const APPLAUSE_FOR = 1_800;
/** How long the hall takes to rise for its standing ovation. */
const RISE = 600;

/** One hand up to ask, both clapping, or both in the air. */
type Hands = 'down' | 'ask' | 'clap' | 'up';

/** What one attendee is doing: how high they've risen, their hands, their badge's glow and their nod. */
export interface Pose {
  lift: number;
  hands: Hands;
  lit: number;
  nod: number;
}

/** What the hall is up to: who's asking, who got the mic, when it last clapped, and how it ended. */
export interface Mood {
  askers: readonly number[];
  cheers: readonly Cheer[];
  applauseAt: number;
  /** When the keynote ended to a standing ovation, or Infinity. */
  ovationAt: number;
  /** Whether the room has gone quiet: everyone's head goes down. */
  quiet: boolean;
}

/** The gentle nod everyone does while listening, each at their own pace. */
const nodOf = (seat: Seat, time: number) =>
  Math.sin(time / (650 + seat.seed * 23) + seat.seed) * 0.4 * seat.s;

/** How far a cheer has got: whether it has reached `seat` and not yet passed, as 1 down to 0, or 0. */
function waveAt(cheer: Cheer, seat: Seat, time: number): number {
  const from = SEATS.at(cheer.seat);
  if (!from) return 0;
  const reach = cheer.at + Math.hypot(from.x - seat.x, from.y - seat.y) * WAVE_SPEED;
  const t = time - reach;
  return t >= 0 && t < WAVE_FOR ? 1 - t / WAVE_FOR : 0;
}

/** What attendee `n` is doing at `time`. */
export function poseOf(n: number, mood: Mood, time: number): Pose {
  const seat = SEATS.at(n);
  if (!seat) return { lift: 0, hands: 'down', lit: 0, nod: 0 };
  const nod = nodOf(seat, time);
  if (time >= mood.ovationAt) {
    const stand = Math.min(1, (time - mood.ovationAt) / RISE);
    return { lift: 3 * seat.s * stand, hands: 'up', lit: 1, nod };
  }
  if (mood.quiet) return { lift: 0, hands: 'down', lit: 0, nod: 1.2 * seat.s };
  const own = mood.cheers.find((cheer) => cheer.seat === n && time - cheer.at < CHEER_FOR);
  if (own) {
    const jump = Math.abs(Math.sin(((time - own.at) / 420) * Math.PI)) * 2.4 * seat.s;
    return { lift: jump, hands: 'up', lit: 1, nod: 0 };
  }
  if (mood.askers.includes(n)) return { lift: 0.6 * seat.s, hands: 'ask', lit: 0, nod };
  const wave = Math.max(0, ...mood.cheers.map((cheer) => waveAt(cheer, seat, time)));
  if (wave > 0) return { lift: 0, hands: 'clap', lit: wave, nod };
  const applause = time - mood.applauseAt;
  if (applause >= 0 && applause < APPLAUSE_FOR) return { lift: 0, hands: 'clap', lit: 0.5, nod };
  return { lift: 0, hands: 'down', lit: 0, nod };
}

/** How an attendee looks: shirt, hair, what's on their head and whether they brought a laptop. */
export interface Look {
  shirt: number;
  hair: number;
  hat: 'none' | 'elf' | 'beanie' | 'headphones';
  laptop: boolean;
}

const HATS = ['none', 'elf', 'none', 'beanie', 'headphones', 'none', 'elf'] as const;

/** Attendee `seat`'s look, chosen from its seed so it's the same every frame. */
export function lookOf(seat: Seat): Look {
  return {
    shirt: seat.seed % 8,
    hair: (seat.seed * 3) % 7,
    hat: HATS.at(seat.seed % HATS.length) ?? 'none',
    laptop: seat.seed % 3 !== 0,
  };
}
