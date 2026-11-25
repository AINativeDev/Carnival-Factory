import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { drawThing } from './render';
import type { ThingKind } from './world';

/** Every thing the map drew before the level props, so moving its brushes is proven to draw the same. */
const SCENERY: ThingKind[] = [
  'tree',
  'drift',
  'cabin',
  'lamp',
  'fence',
  'stable',
  'sleigh',
  'town-tree',
  'wheel',
  'tent',
  'bench',
  'cart',
  'arch',
  'banner',
  'bunting',
];

describe('drawThing', () => {
  it('draws the scenery the same as before its brushes moved', () => {
    const calls = drawingOf((ctx) => {
      SCENERY.forEach((kind, n) => {
        drawThing(ctx, { kind, x: n, y: -n, w: 2, h: 2, seed: 0.3, blocks: true }, 4321);
      });
    });
    expect(fingerprint(calls)).toBe('5e83952cb5e2b0ac (1898 calls)');
  });
});
