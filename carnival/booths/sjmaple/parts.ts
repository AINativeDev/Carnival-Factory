import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** A body to pick: half its width at each row, tip first, how long it spins and how much it wobbles. */
export interface Body {
  name: string;
  rows: readonly number[];
  spin: number;
  wobble: number;
}

/** The bodies on the parts board, in the order a press cycles through them; the first is a fresh top's. */
export const BODIES: readonly [Body, ...Body[]] = [
  { name: 'ROUND', rows: [0, 1, 2, 3, 4, 4, 4, 3, 2], spin: 5_500, wobble: 1 },
  { name: 'WIDE', rows: [0, 1, 3, 4, 5, 6, 6, 5, 3], spin: 7_000, wobble: 0.6 },
  { name: 'TALL', rows: [0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 2], spin: 4_000, wobble: 1.5 },
];

/** A handle to pick: its stem in pixels, whether it has a cap, and what it adds to the spin and the wobble. */
export interface Handle {
  name: string;
  stem: number;
  cap: boolean;
  spin: number;
  wobble: number;
}

/** The handles on the parts board, in the order a press cycles through them; the first is a fresh top's. */
export const HANDLES: readonly [Handle, ...Handle[]] = [
  { name: 'KNOB', stem: 3, cap: true, spin: 500, wobble: 1 },
  { name: 'SHORT', stem: 2, cap: false, spin: 0, wobble: 0.7 },
  { name: 'LONG', stem: 5, cap: false, spin: 1_200, wobble: 1.5 },
];

/** A stripe colour to pick, by the name the parts board shows. */
export interface Stripe {
  name: string;
  color: string;
}

/** The stripes to pick, by name and colour. They are for looks: the test ignores them. */
export const STRIPES: readonly [Stripe, ...Stripe[]] = [
  { name: 'BERRY', color: colors.berry },
  { name: 'VIOLET', color: colors.violet },
  { name: 'MINT', color: colors.mint },
  { name: 'ICE', color: colors.ice },
];

/** A top, as an index into each list of parts. */
export interface Build {
  body: number;
  stripe: number;
  handle: number;
}

/** One of the three parts a visitor picks on the parts board. */
export type Part = keyof Build;

/** The parts `build` is made of. An index off the end of a list falls back to its first part. */
export function partsOf(build: Build): { body: Body; stripe: Stripe; handle: Handle } {
  return {
    body: BODIES[build.body] ?? BODIES[0],
    stripe: STRIPES[build.stripe] ?? STRIPES[0],
    handle: HANDLES[build.handle] ?? HANDLES[0],
  };
}
