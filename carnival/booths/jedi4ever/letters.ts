/**
 * The factory's loop: each letter's trip from the mail slot to the sack or the
 * "maybe later" tray, worked out from `time` alone so the drawing keeps no state.
 */
import { ease, wrap } from './motion';

/** One whole round of the factory, in milliseconds. */
export const LOOP = 12_000;

/** A new letter drops through the slot every `SLOT` milliseconds. */
export const SLOT = 3_000;

/** The toys the elves build from the letters. */
export type Toy = 'train' | 'teddy' | 'rocket';

/** What each of the round's letters becomes: three toys, taking turns, and one for later. */
export const LETTERS: readonly (Toy | 'maybe later')[] = [
  'train',
  'teddy',
  'maybe later',
  'rocket',
];

/** Where a letter is on its trip, from the slot to the sack or the tray. */
type Stage = 'drop' | 'carry' | 'sort' | 'belt' | 'check' | 'hop' | 'float' | 'tray';

/** Each stage of a letter's trip, from its first moment, in milliseconds after it arrives. */
const TOY_TRIP: readonly [Stage, number][] = [
  ['drop', 0],
  ['carry', 800],
  ['sort', 1_400],
  ['belt', 2_600],
  ['check', 6_200],
  ['hop', 7_400],
];
/** A toy is in the sack this long after its letter arrives. */
export const IN_THE_SACK = 8_200;

const LATER_TRIP: readonly [Stage, number][] = [
  ['drop', 0],
  ['carry', 800],
  ['sort', 1_400],
  ['float', 2_600],
  ['tray', 4_000],
];

/** Where things stand in the room, in hundredths of the square. */
export const PLACES = {
  slot: { x: 8, y: 24 },
  pile: { x: 8, y: 69 },
  sort: { x: 28, y: 62 },
  tray: { x: 19.5, y: 33 },
  check: { x: 72, y: 62 },
  sack: { x: 91, y: 64 },
} as const;
/** Where the hammering elf works on the belt: a letter past it has been hammered into a toy. */
export const HAMMER_X = 42;
/** Where the painting elf works on the belt: a toy past it has been painted. */
export const PAINT_X = 56;

/** One letter on its way through the factory at a moment. */
export interface Letter {
  /** Which of the round's letters this is, 0 to 3. */
  slot: number;
  toy: Toy | null;
  stage: Stage;
  /** How far through its stage, 0 to 1. */
  progress: number;
  /** Milliseconds since it dropped through the slot. */
  age: number;
}

/**
 * The letter in `slot` at `time`, or null once its toy is in the sack. Each slot
 * gets a new letter every `LOOP`, `SLOT` after the one before it.
 */
export function letterAt(slot: number, time: number): Letter | null {
  const age = wrap(time - slot * SLOT, LOOP);
  const kind = LETTERS[slot] ?? 'maybe later';
  const toy = kind === 'maybe later' ? null : kind;
  const trip = toy ? TOY_TRIP : LATER_TRIP;
  const end = toy ? IN_THE_SACK : LOOP;
  if (age >= end) return null;
  // The trips are in order, so the stage is the last one that has started.
  let stage: Stage = 'drop';
  let start = 0;
  let next = end;
  for (const [step, from] of trip) {
    if (from > age) {
      next = from;
      break;
    }
    stage = step;
    start = from;
  }
  return { slot, toy, stage, progress: (age - start) / (next - start), age };
}

/** Every letter in the factory at `time`. */
export function lettersAt(time: number): Letter[] {
  return LETTERS.map((_, slot) => letterAt(slot, time)).filter((l): l is Letter => l !== null);
}

/** Where a letter, or the toy it's becoming, is in the room. */
export function placeOf(letter: Letter): { x: number; y: number } {
  const { slot, pile, sort, tray, check, sack } = PLACES;
  const t = letter.progress;
  const between = (a: { x: number; y: number }, b: { x: number; y: number }, k: number) => ({
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
  });
  switch (letter.stage) {
    case 'drop':
      // Falls faster as it goes, like a letter dropping.
      return between(slot, pile, t * t);
    case 'carry': {
      const at = between(pile, sort, ease(t));
      return { x: at.x, y: at.y - Math.sin(t * Math.PI) * 4 };
    }
    case 'sort':
      return { ...sort };
    case 'belt':
      return between(sort, check, t);
    case 'check':
      return { ...check };
    case 'hop': {
      const at = between(check, sack, t);
      return { x: at.x, y: at.y - Math.sin(t * Math.PI) * 14 };
    }
    case 'float': {
      const at = between(sort, tray, ease(t));
      return { x: at.x + Math.sin(t * Math.PI * 2) * 2, y: at.y };
    }
    case 'tray':
      return { ...tray };
  }
}

/** How far a letter on the belt has become a toy: 0 a letter, 1 hammered into shape, 2 painted. */
export function buildOf(letter: Letter): 0 | 1 | 2 {
  if (letter.stage === 'check' || letter.stage === 'hop') return 2;
  if (letter.stage !== 'belt') return 0;
  const { x } = placeOf(letter);
  if (x >= PAINT_X) return 2;
  if (x >= HAMMER_X) return 1;
  return 0;
}
