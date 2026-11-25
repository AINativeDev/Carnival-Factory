import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from './test-support/recording-canvas';
import { drawCard, wrap } from './season-card-drawing';

const booth = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.fillRect(0, 0, size, size);
};

describe('drawCard', () => {
  // Pinned before the drawing moved out of src/season-card.ts, so the move is proven to draw the same.
  it('paints the booth framed, who it belongs to and their numbers', () => {
    const lines = [
      { value: 3, label: 'requests made' },
      { value: 1, label: 'vote received' },
    ];
    const calls = drawingOf((ctx) => {
      drawCard(ctx, 'ana', "Ana's cocoa", booth, lines);
    });
    expect(fingerprint(calls)).toBe('8c351ba7eec883e7 (200 calls)');
    expect(calls).toContainEqual(['fillText', '@ana', 319, 88, 261]);
  });

  it('welcomes a participant with no numbers yet', () => {
    const calls = drawingOf((ctx) => {
      drawCard(ctx, 'ana', "Ana's cocoa", booth, []);
    });
    expect(fingerprint(calls)).toBe('2b0986a7923101ba (215 calls)');
  });
});

describe('wrap', () => {
  it('breaks text at spaces to fit, and gives no lines for no text', () => {
    const lines = drawingOf((ctx) => {
      expect(wrap(ctx, 'one two three', 50)).toEqual(['one two', 'three']);
      expect(wrap(ctx, '', 50)).toEqual([]);
    });
    expect(lines.length).toBeGreaterThan(0);
  });
});
