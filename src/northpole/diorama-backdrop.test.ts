import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { backdropAndSlab } from './diorama-backdrop';

/** A stand-in for a worker's OffscreenCanvas whose 2D context is `context`. */
function offscreenWith(context: unknown) {
  const made: unknown[] = [];
  class FakeOffscreenCanvas {
    constructor(...size: number[]) {
      made.push(size);
    }
    getContext() {
      return context;
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
});
