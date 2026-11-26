/**
 * The studio's buttons out to the real podcast: a small Listen button in the
 * corner while an episode records or plays back, and both links on the wrap-up
 * card. A tap on one asks the page to open that link of the panel (ADR 0058):
 * link 0 is "Listen to the podcast", link 1 "Watch on YouTube". Everything is
 * in the square's 0 to 100 units.
 */
import type { Phase } from './game';

/** The number of each of the panel's links out, as the maintainers list them. */
export const LINKS = { podcast: 0, youtube: 1 } as const;

/** A button on the drawing: where it is, what it says and which link it opens. */
export interface Button {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  link: number;
  /** The one to press first, drawn lit. */
  main: boolean;
}

/** The Listen button in the bottom right corner, while an episode records or plays back. */
const CORNER: Button = {
  x: 78,
  y: 90,
  w: 19,
  h: 7,
  label: '▶ Listen',
  link: LINKS.podcast,
  main: false,
};

/** The wrap-up card's two buttons, the podcast first. */
const CARD: readonly Button[] = [
  {
    x: 49,
    y: 39,
    w: 45,
    h: 6.4,
    label: '▶  Listen to the podcast',
    link: LINKS.podcast,
    main: true,
  },
  { x: 49, y: 46.8, w: 45, h: 5.4, label: 'Watch on YouTube', link: LINKS.youtube, main: false },
];

/** The buttons on the drawing in `phase`. */
export function buttonsFor(phase: Phase): readonly Button[] {
  return phase === 'wrap' ? CARD : [CORNER];
}

/** The link of the button at (`x`, `y`), in units, among `buttons`, or null if none is there. */
export function linkAt(buttons: readonly Button[], x: number, y: number): number | null {
  const hit = buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  return hit ? hit.link : null;
}
