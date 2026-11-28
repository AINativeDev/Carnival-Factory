/**
 * What the Academy remembers between frames for one visit: the step and the
 * beat up, when that beat began (for its little animations), the step it
 * came from (for the walk between stations), the booth and
 * the look the ticket picked, the bugs squashed, and when someone last
 * tapped. The rules that move it on, only ever on a tap, are in journey.ts.
 */

/** With nobody tapping this long, the Academy goes back to its first screen, in ms. */
export const IDLE_RESET = 60_000;

/** All the Academy remembers. */
export interface Visit {
  /** The step up, from 0 (steps.ts). */
  step: number;
  /** The beat of the step up, from 0. */
  beat: number;
  /** When the beat came up. */
  at: number;
  /** The step the visitor came from, so the hall can carry the ticket along from there. */
  from: number;
  /** The booth and the look the ticket picked, from 0. */
  booth: number;
  look: number;
  /** The bugs squashed at the checks, by number. */
  squashed: readonly number[];
  /** When a person last tapped, or -Infinity while nobody has. */
  playedAt: number;
}

/** The first screen, waiting for a tap. */
export function newVisit(time: number): Visit {
  return {
    step: 0,
    beat: 0,
    at: time,
    from: 0,
    booth: 0,
    look: 0,
    squashed: [],
    playedAt: -Infinity,
  };
}
