/**
 * Inside a square: the part of the screen its drawing stands in, beside the
 * visit's panel, and the short fade in and out. Plain functions, so the map
 * and the tests use them the same way. The drawing itself is map-room.ts.
 */
import { isPhone } from './camera';
import type { Box } from './world';

/** How long the fade in or out of a square takes, in milliseconds. */
export const FADE = 500;

/**
 * The part of the viewport the square's drawing stands in: left of the panel
 * on a wide screen, and above it on a phone's.
 */
export function roomArea(width: number, height: number): Box {
  if (isPhone(width)) return { x: 0, y: 0, w: width, h: height * 0.55 };
  return { x: 0, y: 0, w: Math.max(width * 0.5, width - 380), h: height };
}

/** How dark the fade into or out of a square is, from 0 to 1, `elapsed` milliseconds after it began. */
export function fadeAt(elapsed: number, duration = FADE): number {
  if (elapsed < 0 || elapsed >= duration) return 0;
  return 1 - Math.abs(elapsed - duration / 2) / (duration / 2);
}
