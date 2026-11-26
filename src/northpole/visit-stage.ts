/**
 * Where a square's drawing stands while someone is inside it: as big as the
 * screen allows, with nothing round it, for the games and scenes that play
 * better big. Booths need no change for it: every square draws to whatever
 * size it's given. Plain functions; map-room.ts draws it.
 */
import type { Box } from './world';

/** The narrowest the columns either side of a centred drawing get, in CSS pixels. */
export const COLUMN = 280;

/** The smallest drawing worth centring between two columns, in CSS pixels. */
const CENTRED_AT_LEAST = 480;

/**
 * On a wide screen: the drawing in the middle, as tall as fits, with a
 * column of at least `COLUMN` either side of it, its name on the left and its
 * panel on the right (visit-columns.ts). Undefined on a screen too narrow.
 */
export function centredBox(width: number, height: number): Box | undefined {
  const side = Math.min(height, width - 2 * COLUMN);
  if (side < CENTRED_AT_LEAST) return undefined;
  return { x: (width - side) / 2, y: (height - side) / 2, w: side, h: side };
}

/**
 * On a laptop: the biggest square in `area`, the space left of the panel,
 * from the top to the bottom, flush against the panel so the two read as one.
 */
export function boothBox(area: Box): Box {
  const side = Math.max(0, Math.min(area.w, area.h));
  return { x: area.x + area.w - side, y: area.y, w: side, h: side };
}

/** Whether the map frame round `canvas` shows its square full screen (visit-full-screen.ts marks it). */
export const isFullScreen = (canvas: HTMLElement): boolean =>
  canvas.closest<HTMLElement>('.map-frame')?.dataset.full !== undefined;

/** Full screen: the biggest square that fits a `width` by `height` screen, centred, inside the margin. */
export function fullBox(width: number, height: number): Box {
  const side = Math.max(0, Math.min(width, height) - 2 * MARGIN);
  return { x: (width - side) / 2, y: (height - side) / 2, w: side, h: side };
}

/** A phone held upright: the booth fills the width, above the panel's sheet. */
export const isPhoneUpright = (width: number, height: number) => width < 720 && height > width;

/** The space kept clear at a phone's sides, in CSS pixels. */
const MARGIN = 16;

/** Room for the way back to the map above the drawing, on a phone upright, in CSS pixels. */
const BELOW_BACK = 64;

/** On a phone held upright, the booth across the screen's width, under the way back. */
export function wideBox(width: number): Box {
  const side = Math.max(0, width - 2 * MARGIN);
  return { x: MARGIN, y: BELOW_BACK, w: side, h: side };
}
