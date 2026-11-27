/**
 * The five big buttons along the counter's front, one for each thing that
 * goes in a cup, and which one a tap lands on. In the scene's 0 to 100 units.
 */
import { ITEMS } from './orders';

/** One button: its item and its box. */
export interface Button {
  item: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The buttons, left to right in the order of ITEMS. */
export const BUTTONS: readonly Button[] = ITEMS.map((_, item) => ({
  item,
  x: 2.5 + item * 19.2,
  y: 80,
  w: 17.8,
  h: 18,
}));

/** The item of the button under (x, y), or null when the tap missed every button. */
export function buttonAt(x: number, y: number): number | null {
  const hit = BUTTONS.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  return hit ? hit.item : null;
}
