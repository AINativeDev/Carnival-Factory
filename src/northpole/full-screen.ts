/**
 * A booth full screen: its drawing as big as the screen allows, with nothing
 * else round it, for the games and scenes that play better big. Booths need no
 * change for it: every square draws to whatever size it's given. The visit's
 * Full screen pill marks the map's frame (`data-full`), and the room reads it.
 */
import type { Box } from './world';

/** The space kept clear round the drawing, in CSS pixels. */
const MARGIN = 16;

/** Whether the map frame round `canvas` shows its booth full screen. */
export const isFullScreen = (canvas: HTMLElement): boolean =>
  canvas.closest<HTMLElement>('.map-frame')?.dataset.full !== undefined;

/** The biggest square that fits a `width` by `height` screen, centred, inside the margin. */
export function fullBox(width: number, height: number): Box {
  const side = Math.max(0, Math.min(width, height) - 2 * MARGIN);
  return { x: (width - side) / 2, y: (height - side) / 2, w: side, h: side };
}
