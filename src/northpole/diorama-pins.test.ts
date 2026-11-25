import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { theme } from './theme';
import { backdrop, box, cone, drum, glow, iso, pine, scene, shadow, stringLights } from './diorama';

/**
 * Pins what every diorama helper draws, so splitting diorama.ts by concern
 * (docs/adr/0019-small-files.md) is proven to draw exactly the same.
 */
const { colors } = theme;
const stripes = [colors.berry, colors.cream, colors.gold];

describe('the diorama helpers draw the same as before they were split', () => {
  it('paints the backdrop', () => {
    expect(
      fingerprint(
        drawingOf((ctx) => {
          backdrop(ctx);
        }),
      ),
    ).toBe('7c8c11ea7878c298 (152 calls)');
  });

  it('paints a whole scene with its backdrop and slab', () => {
    const calls = drawingOf((ctx) => {
      scene(ctx, 240, 1234, (inner, time) => {
        const p = iso(3, -4, 2);
        inner.fillRect(p.x, p.y, 1, time / 1000);
      });
    });
    expect(fingerprint(calls)).toBe('0c5891eced1d737d (204 calls)');
  });

  it('paints boxes, shadows, glows and pines', () => {
    const calls = drawingOf((ctx) => {
      box(ctx, -5, -3, 8, 6, 10, colors.snow, colors.wood, colors.cocoa);
      box(ctx, 2, 4, 3, 2, 4, colors.gold, colors.berry, colors.ink, 5);
      shadow(ctx, 40, 60, 12);
      glow(ctx, 50, 40, 9);
      glow(ctx, 20, 30, 6, 0.4);
      pine(ctx, 30, 70, 18);
    });
    expect(fingerprint(calls)).toBe('4a776f6b50a011a8 (144 calls)');
  });

  it('paints drums and cones at several turns', () => {
    const calls = drawingOf((ctx) => {
      for (const turn of [0, 0.7, 2.1, 5.9, -1.3]) {
        drum(ctx, 50, 60, 20, 8, stripes, 6, turn, colors.snow);
        cone(ctx, 50, 40, 22, 16, stripes, 5, turn);
      }
    });
    expect(fingerprint(calls)).toBe('2ceb2b3cc9c0cfeb (1014 calls)');
  });

  it('hangs string lights', () => {
    const points = [0, 1, 2, 3, 4, 5].map((n) => ({ x: 10 + n * 12, y: 30 + (n % 2) * 3 }));
    const calls = drawingOf((ctx) => {
      stringLights(ctx, points, stripes, 0);
      stringLights(ctx, points, stripes, 4567);
    });
    expect(fingerprint(calls)).toBe('49bf70b6a380444a (144 calls)');
  });
});
