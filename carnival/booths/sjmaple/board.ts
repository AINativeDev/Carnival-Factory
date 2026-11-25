import { canvasFont } from '../../../src/northpole/theme';
import type { Part } from './parts';

/** The square is drawn on a GRID by GRID board of chunky pixels. */
export const GRID = 64;

/** Where things stand on the board, in pixels. */
export const PLACES = {
  bench: { x: 17, y: 41 },
  mat: { x: 47, y: 47 },
} as const;

/** What a press can land on: one of the parts, or the spin button. */
export type Button = Part | 'spin';

/** A button's pixel rectangle on the board, and what it is. */
export interface ButtonArea {
  name: Button;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The spin button, beside the test board it reports to. */
export const SPIN_BUTTON: ButtonArea = { name: 'spin', x: 38, y: 11, w: 22, h: 8 };

/** The buttons, as pixel rectangles on the board: the three parts, then the spin button. */
export const BUTTONS: readonly ButtonArea[] = [
  { name: 'body', x: 2, y: 2, w: 25, h: 7 },
  { name: 'stripe', x: 2, y: 10, w: 25, h: 7 },
  { name: 'handle', x: 2, y: 18, w: 25, h: 7 },
  SPIN_BUTTON,
];

/** The button at board pixel (x, y), or null. */
export function buttonAt(x: number, y: number): Button | null {
  const hit = BUTTONS.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  return hit ? hit.name : null;
}

/** Paints a `w` by `h` block of board pixels at (x, y), snapped so neighbours never leave a seam. */
export type Plot = (color: string, x: number, y: number, w?: number, h?: number) => void;

/** The pixel grid every shape snaps to, at `size` canvas pixels across. */
export function pixels(ctx: CanvasRenderingContext2D, size: number): Plot {
  const px = size / GRID;
  return (color, x, y, w = 1, h = 1) => {
    ctx.fillStyle = color;
    const x0 = Math.round(x * px);
    const y0 = Math.round(y * px);
    ctx.fillRect(x0, y0, Math.round((x + w) * px) - x0, Math.round((y + h) * px) - y0);
  };
}

/** The font at `height` board pixels. */
export function font(size: number, height: number) {
  return canvasFont('small', 'bold').replace(/\d+px/, `${Math.round((size * height) / GRID)}px`);
}
