/**
 * The six places on the house a note can sit, and which one a tap lands on:
 * the two mirror windows and the candy-cane door on its front, two big
 * gumdrops on its roof and the round attic window in its gable. Points are on
 * the house before it leans, in the scene's 0 to 100 units.
 */
import { iso, type Point } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** What stands at each place: it decides how the note there is drawn. */
export type Fixture = 'pane' | 'door' | 'gumdrop' | 'attic';

/** The places, in the order notes join: the first four from the start, then the fifth and sixth. */
export const SLOTS: readonly { at: Point; fixture: Fixture; mirror: number }[] = [
  { at: iso(-9, 10, 11), fixture: 'pane', mirror: 0 },
  { at: iso(0, 10, 6), fixture: 'door', mirror: -1 },
  { at: iso(9, 10, 11), fixture: 'pane', mirror: 1 },
  { at: iso(-8, 5, 26.6), fixture: 'gumdrop', mirror: -1 },
  { at: iso(6, 5, 26.6), fixture: 'gumdrop', mirror: -1 },
  { at: iso(14, -4, 22), fixture: 'attic', mirror: -1 },
];

/** Each note's colour, by note: the door starts berry, as a candy cane should. */
export const TONE_COLOURS: readonly string[] = [
  colors.mint,
  colors.berry,
  colors.violet,
  colors.gold,
  colors.ice,
  colors.horizon,
];

/** How far from a place's middle a tap still lands on it, in units. */
const REACH = 8.5;

/**
 * Which of the places in `used` a tap at `x`, `y` on the house lands on: the
 * nearest within reach, or -1 for none, so a tap near a feature counts.
 */
export function slotAt(x: number, y: number, used: readonly number[]): number {
  let found = -1;
  let nearest = REACH;
  for (const slot of used) {
    const at = SLOTS.at(slot)?.at ?? { x: -100, y: -100 };
    const away = Math.hypot(x - at.x, y - at.y);
    if (away <= nearest) {
      found = slot;
      nearest = away;
    }
  }
  return found;
}

/** How far from a place's middle a treat sits: on the feature's rim, clear of its badge. */
const RIM = 5;

/**
 * Where a treat for a right tap at `x`, `y` on place `slot` sticks: out on
 * the feature's rim in the tap's direction, so it decorates round the note
 * rather than hiding its badge. A tap on the badge itself goes round the rim
 * by `turn`, the treats' count, so they spread rather than pile up.
 */
export function rimOf(slot: number, x: number, y: number, turn: number): { x: number; y: number } {
  const at = SLOTS.at(slot)?.at ?? { x, y };
  const away = Math.hypot(x - at.x, y - at.y);
  const angle = away < 2.7 ? turn * 2.4 : Math.atan2(y - at.y, x - at.x);
  const reach = Math.max(RIM, Math.min(away, RIM + 2));
  return { x: at.x + Math.cos(angle) * reach, y: at.y + Math.sin(angle) * reach };
}
