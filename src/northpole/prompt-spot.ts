/**
 * Where the call to action over a door sits on the map's frame: above its
 * square, kept on the frame, and never over a corner link such as "Back to
 * the North Pole". A square near the top of a phone's map would otherwise put
 * the call to action over the way home, and a tap there would visit the
 * square instead (docs/specs/mobile.md). Plain numbers, so it's tested
 * without a page.
 */
import type { Tile } from './world';

/** A box on the frame, in CSS pixels from its top-left. */
export interface FrameBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How far the call to action keeps from the frame's edges and from a corner link. */
const GAP = 8;

/**
 * The call to action's top-left corner: centred on `anchor` with its foot on
 * it, `GAP` in from the frame's edges, and moved below any of `keepClear` it
 * would cover.
 */
export function promptSpot(
  anchor: Tile,
  size: { w: number; h: number },
  frame: { width: number; height: number },
  keepClear: readonly FrameBox[],
): Tile {
  const x = Math.max(GAP, Math.min(frame.width - size.w - GAP, anchor.x - size.w / 2));
  let y = Math.max(GAP, Math.min(frame.height - size.h - GAP, anchor.y - size.h));
  for (const box of keepClear) {
    const across = x < box.x + box.w && x + size.w > box.x;
    const over = y < box.y + box.h && y + size.h > box.y;
    if (across && over) y = box.y + box.h + GAP;
  }
  return { x, y };
}

/** The links in the frame's top corners that are showing: "Back to the North Pole" and "Built with Tessl". */
export function cornerLinks(frame: HTMLElement): FrameBox[] {
  return [...frame.querySelectorAll<HTMLElement>('.hud-home, .hud-tessl')]
    .filter((link) => link.offsetWidth > 0)
    .map((link) => ({
      x: link.offsetLeft,
      y: link.offsetTop,
      w: link.offsetWidth,
      h: link.offsetHeight,
    }));
}
