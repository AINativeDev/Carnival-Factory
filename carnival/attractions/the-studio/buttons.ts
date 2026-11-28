/**
 * The studio's buttons. While the host records a demo, the footer's one
 * primary is "Go on air ▶"; while a visitor's episode records or plays back,
 * the footer has a quiet "Hear the podcast ↗" instead; and the end card has the
 * shared structure: the podcast as the hero, YouTube and "Play again ▶" side
 * by side under it. A tap on a link asks the page to open that link of the
 * panel (ADR 0058): link 0 is "Listen to the podcast", link 1 "Watch on
 * YouTube". Everything is in the square's 0 to 100 units, and every button is
 * at least 9 tall, big enough for a finger.
 */
import type { Phase } from './game';
import { FOOTER, MARGIN } from './layout';

/** The number of each of the panel's links out, as the maintainers list them. */
export const LINKS = { podcast: 0, youtube: 1 } as const;

/** How loud a button is: the one gold primary, a light secondary, or underlined text. */
type Weight = 'primary' | 'secondary' | 'tertiary';

/** A button on the drawing: where it is, what it says, how loud it is, and the link it opens, if any. */
export interface Button {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  /** The link it opens, or null for a button that goes on, like any other tap. */
  link: number | null;
  weight: Weight;
}

/** The footer's button slot, on the right. */
const SLOT = { x: 62, y: FOOTER.mid - 5, w: 100 - MARGIN - 62, h: 10 } as const;

/** The demo's one primary: any tap goes on air, and this is where it says so. */
const GO_ON_AIR: Button = { ...SLOT, label: 'Go on air ▶', link: null, weight: 'primary' };

/** The quiet link out while a visitor's episode records or plays back. */
const HEAR: Button = {
  ...SLOT,
  label: 'Hear the podcast ↗',
  link: LINKS.podcast,
  weight: 'tertiary',
};

/** The end card's buttons: the hero, then two secondaries side by side. */
const CARD = { x: 14, w: 72, hero: 50, second: 63.5 } as const;

/** The end card's buttons, the last one going on: "Go on air ▶" after the demo, "Play again ▶" after yours. */
function card(visitor: boolean): readonly Button[] {
  const half = (CARD.w - 2) / 2;
  const second = { y: CARD.second, w: half, h: 9.5, weight: 'secondary' } as const;
  return [
    {
      ...{ x: CARD.x, y: CARD.hero, w: CARD.w, h: 11, weight: 'primary' },
      ...{ label: 'Listen to the podcast ↗', link: LINKS.podcast },
    },
    { ...second, x: CARD.x, label: 'Watch on YouTube ↗', link: LINKS.youtube },
    {
      ...second,
      x: CARD.x + half + 2,
      label: visitor ? 'Play again ▶' : 'Go on air ▶',
      link: null,
    },
  ];
}

/** The buttons on the drawing in `phase`, for a visitor's episode or the host's demo. */
export function buttonsFor(phase: Phase, visitor: boolean): readonly Button[] {
  if (phase === 'wrap') return card(visitor);
  return visitor ? [HEAR] : [GO_ON_AIR];
}

/** The link of the button at (`x`, `y`), in units, among `buttons`, or null if none is there. */
export function linkAt(buttons: readonly Button[], x: number, y: number): number | null {
  const hit = buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  return hit ? hit.link : null;
}
