import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { drawTree, setSpriteResolution } from './pines';
import type { Thing } from './world';

const tree = (seed: number): Thing => ({
  kind: 'tree',
  x: 2,
  y: 3,
  w: 1,
  h: 1,
  seed,
  blocks: true,
});

/** A page whose canvases hand out `context`, so the sprites can be drawn outside a browser. */
function stubPage(context: () => unknown) {
  const made: { width: number; height: number }[] = [];
  vi.stubGlobal('document', {
    createElement: () => {
      const canvas = { width: 0, height: 0, getContext: context };
      made.push(canvas);
      return canvas;
    },
  });
  return made;
}

// Each test sets a resolution of its own, which clears the sprites drawn before it.
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the forest pines', () => {
  it('draws each size once to a sprite at the camera resolution, then copies it', () => {
    let sprite: unknown;
    drawingOf((ctx) => {
      sprite = ctx;
    });
    const made = stubPage(() => sprite);
    setSpriteResolution(2);
    setSpriteResolution(2.01);
    const calls = drawingOf((ctx) => {
      drawTree(ctx, tree(0));
      drawTree(ctx, tree(0));
    });
    expect(made).toHaveLength(1);
    expect(calls.filter(([name]) => name === 'drawImage')).toHaveLength(2);
  });

  it('draws the pine itself where a canvas has no 2D context', () => {
    stubPage(() => null);
    setSpriteResolution(1);
    const calls = drawingOf((ctx) => {
      drawTree(ctx, tree(1));
    });
    expect(calls.some(([name]) => name === 'drawImage')).toBe(false);
    expect(calls.some(([name]) => name === 'fill')).toBe(true);
  });
});
