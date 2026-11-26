/**
 * Where the things a visitor taps stand in the classroom, in the square's 0
 * to 100 units, and which of them is under a tap. The drawing and the rules
 * both read these, so a card is always tapped where it is drawn.
 */

/** A rectangle in the square's units. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The three answer cards along the front of the classroom, left to right. */
export const CARDS: readonly Box[] = [0, 1, 2].map((n) => ({ x: 3 + n * 32, y: 66, w: 30, h: 29 }));
/** On the report card, the card that starts a new game. */
export const AGAIN: Box = { x: 4, y: 68, w: 42, h: 22 };
/** On the report card, the gold card that opens the real Academy. */
export const ACADEMY: Box = { x: 50, y: 68, w: 46, h: 22 };
/** The small Academy sign by the window, there while a game or the demo is on. */
export const SIGN: Box = { x: 84, y: 34, w: 15.5, h: 8 };
/** The chalkboard's writing surface, inside its frame. */
export const BOARD: Box = { x: 18, y: 5, w: 64, h: 45 };

/** Whether `x`, `y` is in `box`, edges included. */
export function inside(box: Box, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

/** Which answer card is at `x`, `y`, or -1 for none. */
export function cardAt(x: number, y: number): number {
  return CARDS.findIndex((card) => inside(card, x, y));
}

/**
 * Whether a tap at `x`, `y` lands on a way out to the real Academy: the big
 * card on the report card, or the small sign while anything else is up.
 */
export function academyAt(report: boolean, x: number, y: number): boolean {
  return inside(report ? ACADEMY : SIGN, x, y);
}
