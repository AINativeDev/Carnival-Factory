/**
 * The nudges: the ways on from the Academy. A drawing can't open anything
 * itself (it runs sandboxed), so a tap on one makes the attraction's `ask()`
 * answer for one frame: `{ open: n }` for the page's link number n (0 Start
 * the Academy, 1 the Your booth form, 2 AI DevCon tickets, 3 the Tessl blog,
 * 4 the podcast, the order the page lists them in), or `{ visit:
 * 'the-factory' }` to go to the Factory on the map. The journey keeps the
 * screen to itself, with one quiet link in the footer's corner; the ways on
 * wait for the "you're on the map" card, in order: asking for a real booth,
 * the one gold button; two secondary buttons side by side; and a quiet line
 * of links to keep in touch. Every box is at least 9 tall, for a finger.
 */
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { type Box, inside } from './layout';

/** What a square's `ask()` may answer: a link to open or a place to visit. */
export type SquareAsk = NonNullable<ReturnType<NonNullable<NorthPoleSquare['ask']>>>;

/** How a nudge stands: the gold hero, a secondary button, or a quiet text link. */
type Rank = 'hero' | 'button' | 'link';

/** One nudge: where it is, what it says, what it asks of the page, and how it stands. */
export interface Nudge {
  box: Box;
  label: string;
  ask: SquareAsk;
  rank: Rank;
}

/** The one quiet link in the corner during the journey. */
export const QUIET_NUDGES: readonly Nudge[] = [
  {
    box: { x: 58, y: 90.8, w: 38, h: 9 },
    label: 'Start the Academy ↗',
    ask: { open: 0 },
    rank: 'link',
  },
];

/** Where the "Keep in touch:" words end on the map card, before its links. */
export const KEEP_IN_TOUCH = { x: 43, y: 92 };

/** The ways on, on the "you're on the map" card. */
export const BIG_NUDGES: readonly Nudge[] = [
  {
    box: { x: 4, y: 65.5, w: 92, h: 10 },
    label: 'Want a real one? Ask for a booth ↗',
    ask: { open: 1 },
    rank: 'hero',
  },
  {
    box: { x: 4, y: 77.5, w: 45, h: 9 },
    label: 'Start the Academy ↗',
    ask: { open: 0 },
    rank: 'button',
  },
  {
    box: { x: 51, y: 77.5, w: 45, h: 9 },
    label: 'Why a factory? →',
    ask: { visit: 'the-factory' },
    rank: 'button',
  },
  { box: { x: 44, y: 87.5, w: 18, h: 9 }, label: 'AI DevCon', ask: { open: 2 }, rank: 'link' },
  { box: { x: 64, y: 87.5, w: 11, h: 9 }, label: 'Blog', ask: { open: 3 }, rank: 'link' },
  { box: { x: 77, y: 87.5, w: 16, h: 9 }, label: 'Podcast', ask: { open: 4 }, rank: 'link' },
];

/**
 * The page's link for the booth form filled in with the ticket's own booth in
 * its look: the Academy's pretend booths follow its five ways on, booth by
 * booth, three looks each (src/northpole/booth-ideas.ts, ADR 0065).
 */
export const ideaLink = (booth: number, look: number) => 5 + booth * 3 + look;

/** The nudges on show: the ways on on the "you're on the map" card, the quiet link otherwise. */
export const nudgesFor = (big: boolean): readonly Nudge[] => (big ? BIG_NUDGES : QUIET_NUDGES);

/** What a tap at `x`, `y` asks of the page, a fresh answer each time, or undefined off every nudge. */
export function nudgeAt(big: boolean, x: number, y: number): SquareAsk | undefined {
  const hit = nudgesFor(big).find((nudge) => inside(nudge.box, x, y));
  return hit ? { ...hit.ask } : undefined;
}
