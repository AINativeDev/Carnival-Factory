/**
 * Where a square's drawing stands while someone is inside it: as big as the
 * screen allows, with nothing round it, for the games and scenes that play
 * better big. Booths need no change for it: every square draws to whatever
 * size it's given. Plain functions; map-room.ts draws it.
 */
import type { Box } from './world';

/**
 * On a laptop: the biggest square in `area`, the space left of the panel,
 * running from just under the top bar to the bottom, in the middle across.
 */
export function boothBox(area: Box): Box {
  const side = Math.max(0, Math.min(area.w, area.h));
  return { x: area.x + (area.w - side) / 2, y: area.y, w: side, h: side };
}

/** A phone held upright: the booth fills the width, above the panel's sheet. */
export const isPhoneUpright = (width: number, height: number) => width < 720 && height > width;

/** The space kept clear at a phone's sides, in CSS pixels. */
const MARGIN = 16;

/** Room for the way back to the map above the drawing, on a phone upright, in CSS pixels. */
const BELOW_BACK = 56;

/** On a phone held upright, the booth across the screen's width, under the way back. */
export function wideBox(width: number): Box {
  const side = Math.max(0, width - 2 * MARGIN);
  return { x: MARGIN, y: BELOW_BACK, w: side, h: side };
}
