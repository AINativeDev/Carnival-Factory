/**
 * Where the elves' round stands at any moment, worked out from `time` alone,
 * so the booth keeps no state of its own while nobody plays and every frame
 * of the scene agrees with every other.
 */
import { RANKS, seat, SUITS, withSeat } from './deck';
import { FLIPS } from './rounds';
import type { Round } from './rounds';

/** One whole round, in milliseconds. */
export const LOOP = 12_000;

/** Each flip takes this long, and its card is in the air for `FLIGHT` of it. */
export const FLIP_TIME = 1_320;
/** How long a flipped card is in the air, which the elf also waits before it can slap. */
export const FLIGHT = 520;

type Stage = 'deal' | 'flip' | 'slap' | 'cheer' | 'collect' | 'gather';

/** Each stage of a round, from its first moment, in milliseconds. */
const STAGES: readonly [Stage, number][] = [
  ['deal', 0],
  ['flip', 1_000],
  ['slap', 1_000 + FLIPS * FLIP_TIME],
  ['cheer', 8_400],
  ['collect', 10_000],
  ['gather', 11_000],
];

/** Wraps `value` into [0, `span`), negative values included. */
function wrap(value: number, span: number) {
  return ((value % span) + span) % span;
}

/** 0 to 1, slow at both ends, so cards and hands start and settle gently. */
export function ease(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/** A moment in the elves' round: which round, which stage of it, and how far through. */
export interface Moment {
  /** Which round, counting from when the page loaded. */
  index: number;
  stage: Stage;
  /** How far through its stage, 0 to 1. */
  progress: number;
}

/** Where the game stands at `time`. Each round lasts `LOOP`. */
export function momentAt(time: number): Moment {
  const index = Math.floor(time / LOOP);
  const t = wrap(time, LOOP);
  let [stage, from, to]: [Stage, number, number] = ['deal', 0, LOOP];
  for (const [name, start] of STAGES) {
    if (t < start) {
      to = start;
      break;
    }
    [stage, from] = [name, start];
  }
  return { index, stage, progress: (t - from) / (to - from) };
}

/**
 * During the flips: how many cards have landed on the pile, and how far
 * through the air the next one is, 0 to 1, or null while nobody is flipping.
 */
export function flipsAt(moment: Moment): { landed: number; flying: number | null } {
  if (moment.stage === 'deal') return { landed: 0, flying: null };
  if (moment.stage !== 'flip') return { landed: FLIPS, flying: null };
  const ms = moment.progress * FLIPS * FLIP_TIME;
  const n = Math.floor(ms / FLIP_TIME);
  const into = ms - n * FLIP_TIME;
  return into < FLIGHT ? { landed: n, flying: into / FLIGHT } : { landed: n + 1, flying: null };
}

/** How many face-down cards are in each elf's stack, and in the deck in the middle, at `moment`. */
export function stacksAt(moment: Moment, round: Round): { hands: [number, number]; deck: number } {
  const whole = RANKS * SUITS;
  const half = whole / 2;
  const { stage, progress } = moment;
  if (stage === 'deal') {
    const dealt = Math.floor(progress * whole);
    return { hands: [Math.ceil(dealt / 2), Math.floor(dealt / 2)], deck: whole - dealt };
  }
  let gone: [number, number] = [0, 0];
  const { landed, flying } = flipsAt(moment);
  for (const f of round.flips.slice(0, landed + (flying === null ? 0 : 1)))
    gone = withSeat(gone, f.player, seat(gone, f.player) + 1);
  let hands: [number, number] = [half - gone[0], half - gone[1]];
  if (stage === 'gather') {
    hands = withSeat(hands, round.winner, seat(hands, round.winner) + FLIPS);
    const left = 1 - progress;
    const back = Math.round(hands[0] * left) + Math.round(hands[1] * left);
    return {
      hands: [Math.round(hands[0] * left), Math.round(hands[1] * left)],
      deck: whole - back,
    };
  }
  return { hands, deck: 0 };
}
