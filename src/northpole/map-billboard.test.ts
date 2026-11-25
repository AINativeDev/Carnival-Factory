// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BILLBOARD, BOARD } from './billboard';
import { middle } from './brushes';
import { worldToScreen } from './camera-view';
import { billboardUnder, onClick } from './map-input';
import { onPointerMove } from './map-touch';
import type { MapRun } from './map-state';
import type { Thing } from './world';

const billboard: Thing = { kind: 'billboard', x: 4, y: -4, w: 2, h: 1, seed: 0, blocks: true };
const size = { width: 800, height: 600 };

/** Just enough of a running map for a click: a canvas, the camera, and the world's things. */
function running(things: Thing[]): MapRun {
  return {
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, ...size }), style: { cursor: '' } },
    pointer: { tapped: () => true },
    visiting: undefined,
    camera: { x: 0, y: 0 },
    zoom: 1,
    world: { things },
    targets: [],
  } as unknown as MapRun;
}

/** Where the middle of the board is on the screen. */
function onBoard(): { clientX: number; clientY: number } {
  const foot = middle(billboard);
  const at = worldToScreen(
    { x: foot.x, y: foot.y - BOARD.post - BOARD.h / 2 },
    size.width,
    size.height,
    { x: 0, y: 0 },
    1,
  );
  return { clientX: at.x, clientY: at.y };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the billboard on the map', () => {
  it('is found under a point on its board, and nowhere when there is none', () => {
    const foot = middle(billboard);
    const board = { x: foot.x, y: foot.y - BOARD.post - BOARD.h / 2 };
    expect(billboardUnder(running([billboard]), board)).toBe(true);
    expect(billboardUnder(running([]), board)).toBe(false);
    expect(billboardUnder(running([billboard]), { x: foot.x, y: foot.y + 40 })).toBe(false);
  });

  it('opens the tickets page in a new tab when clicked', () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    onClick(running([billboard]), new MouseEvent('click', onBoard()));
    expect(opened).toHaveBeenCalledWith(BILLBOARD.tickets, '_blank', 'noopener');
  });

  it('shows a pointing hand over it, as over a square', () => {
    const map = running([billboard]);
    onPointerMove(map, new PointerEvent('pointermove', { ...onBoard(), pointerType: 'mouse' }));
    expect(map.canvas.style.cursor).toBe('pointer');
    onPointerMove(
      map,
      new PointerEvent('pointermove', { clientX: 1, clientY: 1, pointerType: 'mouse' }),
    );
    expect(map.canvas.style.cursor).toBe('default');
  });
});
