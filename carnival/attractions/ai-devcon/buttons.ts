/**
 * The "Get tickets" buttons, the one way out of the drawing: a small sign by
 * the stage, always there, and a big button on the end card. A tap on either
 * asks the page to open the panel's first link, the conference's tickets, in
 * a new tab (square-ask.ts); the drawing itself never links anywhere.
 */
import type { Mode } from './state';

/** A rectangle of the drawing a tap can land on, in the 0 to 100 units. */
export interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The small tickets sign to the right of the stage. */
export const SIGN: Area = { x: 80, y: 38.5, w: 17, h: 7 };
/** The big tickets button on the end card. */
export const CARD_BUTTON: Area = { x: 35, y: 27.5, w: 30, h: 6.5 };
/** The panel's link to the tickets: its first. */
export const TICKETS_LINK = 0;

const inside = (area: Area, x: number, y: number) =>
  x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;

/** Whether a tap at `x`, `y` in `mode` lands on a tickets button. */
export function ticketsAt(mode: Mode, x: number, y: number): boolean {
  const ended = mode === 'won' || mode === 'lost';
  return inside(SIGN, x, y) || (ended && inside(CARD_BUTTON, x, y));
}

/** What the drawing asks of the page after a frame: the tickets link once, after a tap on a button. */
export function takeAsk<T extends { asking: boolean }>(
  game: T,
): { game: T; ask?: { open: number } } {
  if (!game.asking) return { game };
  return { game: { ...game, asking: false }, ask: { open: TICKETS_LINK } };
}
