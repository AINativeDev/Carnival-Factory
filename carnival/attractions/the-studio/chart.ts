/**
 * An episode's chart: the words that slide along the track into the mic, when
 * each one should be said, and which are long words to hold. Every episode is
 * quicker than the last, and each speeds up as it goes, so the challenge rises.
 */

/** How long a word takes to slide from the right of the track to the ring by the mic, in ms. */
export const TRAVEL = 1_900;
/** How long before the first word reaches the ring. */
export const LEAD = 2_400;
/** Within this many ms of the beat, a word is perfect. */
export const PERFECT = 90;
/** Within this many, it's good; any later and it's missed. */
export const GOOD = 190;
/** Words in one episode. */
export const WORDS = 18;

/** The playful things said on the studio's podcast, one per word, in turn. */
export const PHRASES = [
  'Ship it!',
  'Spec first!',
  'Agents, assemble!',
  'Prompt → PR',
  'LGTM!',
  'Context is king',
  'Hot take: tests!',
  'Works on my sleigh',
  'Merge by Christmas',
  'Ho-ho-hotfix!',
  'The elves review it',
  'Vibe check ✓',
] as const;

/** One word on the chart: when it reaches the ring, in ms from the episode's start, and how long to hold it. */
export interface Beat {
  at: number;
  hold: number;
}

/** How much quicker episode `episode` (from 1) is than the first: never more than twice as quick. */
export function pace(episode: number): number {
  return Math.max(0.55, 1 - (episode - 1) * 0.12);
}

/**
 * The chart of episode `episode`: gaps that shrink as it goes, and every fourth
 * word a long one to hold, with room after it to let go.
 */
export function chart(episode: number): Beat[] {
  const beats: Beat[] = [];
  let at = LEAD;
  for (let n = 0; n < WORDS; n++) {
    const hold = n % 4 === 3 ? Math.round(750 * pace(episode)) : 0;
    beats.push({ at, hold });
    at += Math.round((1_000 - n * 30) * pace(episode)) + hold;
  }
  return beats;
}

/** When the last word of `beats` has been said and let go, in ms from the start. */
export function ending(beats: readonly Beat[]): number {
  const last = beats.at(-1);
  return last ? last.at + last.hold + GOOD + 300 : 0;
}

/** Where on the track a word is when it's `early` ms from its beat: 1 at the far right, 0 at the ring. */
export function along(early: number): number {
  return early / TRAVEL;
}
