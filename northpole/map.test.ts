import { describe, expect, it, vi } from 'vitest';
import { drawSquare } from './map';
import type { NorthPoleSquare } from './square';

/** A stand-in canvas context that records the calls made on it. */
function recordingContext() {
  const calls: string[] = [];
  const args: unknown[][] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (target, key: string) =>
      key in target
        ? target[key]
        : (target[key] = (...callArgs: unknown[]) => {
            calls.push(key);
            args.push(callArgs);
          }),
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, args };
}

function scratchCanvas() {
  const { ctx, calls } = recordingContext();
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  (ctx as unknown as { canvas: unknown }).canvas = canvas;
  return { canvas: canvas as unknown as HTMLCanvasElement, calls };
}

const booth = (draw: NorthPoleSquare['draw']): NorthPoleSquare => ({
  id: 'comet',
  name: 'Comet',
  description: 'A booth.',
  draw,
});

describe('drawSquare', () => {
  it('draws the booth on the scratch canvas and copies it onto the map', () => {
    const map = recordingContext();
    const scratch = scratchCanvas();
    drawSquare(
      map.ctx,
      scratch.canvas,
      booth((ctx) => ctx.fillRect(0, 0, 1, 1)),
      10,
      20,
      100,
      0,
    );
    expect(scratch.canvas.width).toBe(100);
    expect(scratch.calls).toEqual(['fillRect']);
    expect(map.calls).toEqual(['drawImage']);
    expect(map.args[0]).toEqual([scratch.canvas, 0, 0, 100, 100, 10, 20, 100, 100]);
  });

  it('copies only the booth square when the booth enlarges its canvas', () => {
    const map = recordingContext();
    const scratch = scratchCanvas();
    const greedy = booth((ctx) => {
      ctx.canvas.width = 400;
      ctx.canvas.height = 400;
      ctx.fillRect(0, 0, 400, 400);
    });
    drawSquare(map.ctx, scratch.canvas, greedy, 10, 20, 100, 0);
    expect(map.args[0]).toEqual([scratch.canvas, 0, 0, 100, 100, 10, 20, 100, 100]);
  });

  it('shows the placeholder when the booth canvas cannot be copied', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const map = recordingContext();
    const scratch = scratchCanvas();
    (map.ctx as unknown as Record<string, unknown>).drawImage = () => {
      throw new DOMException(
        'The image argument is a canvas element with a width or height of 0.',
        'InvalidStateError',
      );
    };
    const empty = booth((ctx) => {
      ctx.canvas.width = 0;
    });
    drawSquare(map.ctx, scratch.canvas, empty, 10, 20, 100, 0);
    expect(map.calls).toEqual(['save', 'fillRect', 'fillText', 'restore']);
  });

  it("keeps a throwing booth's state off the map and shows the placeholder", () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const map = recordingContext();
    const scratch = scratchCanvas();
    const broken = booth((ctx) => {
      ctx.save();
      ctx.translate(500, 500);
      ctx.globalAlpha = 0;
      throw new Error('oops');
    });
    drawSquare(map.ctx, scratch.canvas, broken, 10, 20, 100, 0);
    expect(scratch.calls).toEqual(['save', 'translate']);
    expect(map.calls).toEqual(['save', 'fillRect', 'fillText', 'restore']);
  });
});
