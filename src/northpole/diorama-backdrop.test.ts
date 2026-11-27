import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { backdropAndSlab } from './diorama-backdrop';

/** A stand-in for a worker's OffscreenCanvas whose 2D context is `context`. */
function offscreenWith(context: unknown) {
  const made: unknown[] = [];
  class FakeOffscreenCanvas {
    constructor(...size: number[]) {
      made.push(size);
    }
    getContext(type: string) {
      return type === '2d' ? context : null;
    }
  }
  vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
  return made;
}

const layer = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the backdrop and slab in a worker', () => {
  it('draws them once for a size and copies them in every frame after', () => {
    const made = offscreenWith(layer);
    const first = drawingOf((ctx) => {
      backdropAndSlab(ctx, 321);
    });
    const second = drawingOf((ctx) => {
      backdropAndSlab(ctx, 321);
    });
    expect(made).toEqual([[321, 321]]);
    expect(first.map(([name]) => name)).toEqual(['drawImage']);
    expect(second.map(([name]) => name)).toEqual(['drawImage']);
  });

  it('draws them straight onto the square when the worker gives no 2D context', () => {
    offscreenWith(null);
    const calls = drawingOf((ctx) => {
      backdropAndSlab(ctx, 123);
    });
    expect(calls.some(([name]) => name === 'drawImage')).toBe(false);
    expect(calls.length).toBeGreaterThan(100);
  });

  it('scales the copy to its size, draws the backdrop and slab on it, and copies it to fill the square', () => {
    let kept: unknown[] = [];
    const recorded = drawingOf((layered) => {
      const made = offscreenWith(layered);
      const frames = [500, 500, 250].map((size) =>
        drawingOf((ctx) => {
          backdropAndSlab(ctx, size);
        }),
      );
      expect(made).toEqual([
        [500, 500],
        [250, 250],
      ]);
      kept = frames.map((calls) => calls.map(([name, , ...rest]) => [name, ...rest]));
    });
    expect(kept).toEqual([
      [['drawImage', 0, 0, 100, 100]],
      [['drawImage', 0, 0, 100, 100]],
      [['drawImage', 0, 0, 100, 100]],
    ]);
    const scales = recorded.filter(([name]) => name === 'scale');
    expect(scales).toEqual([
      ['scale', 5, 5],
      ['scale', 2.5, 2.5],
    ]);
    const straight = drawingOf((ctx) => {
      vi.stubGlobal('OffscreenCanvas', undefined);
      backdropAndSlab(ctx, 500);
    });
    const once = recorded.slice(
      1,
      recorded.findIndex(([name], n) => n > 0 && name === 'scale'),
    );
    expect(once).toEqual(straight);
  });
});

describe('the backdrop and slab, as a worker first loads them', () => {
  it('draw the same sky, stars, ridges, hills and drifts', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    vi.resetModules();
    const fresh = await import('./diorama-backdrop');
    const calls = drawingOf((ctx) => {
      fresh.backdropAndSlab(ctx, 240);
    });
    expect(fingerprint(calls)).toMatchInlineSnapshot(`"454d973de0e9a9c7 (200 calls)"`);
  });
});
