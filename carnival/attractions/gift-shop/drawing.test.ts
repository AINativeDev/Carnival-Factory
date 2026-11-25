import { describe, expect, it } from 'vitest';
import giftShop from './attraction';
import { swatchBox } from './wrapping';

/** A context that only keeps the words drawn, enough to see what the card asks. */
function recorder() {
  const texts: unknown[] = [];
  const gradient = { addColorStop: () => undefined };
  const noop = () => undefined;
  const ctx = {
    ...Object.fromEntries(
      [
        'save',
        'restore',
        'scale',
        'translate',
        'transform',
        'fillRect',
        'beginPath',
        'closePath',
        'arc',
        'ellipse',
        'fill',
        'stroke',
        'moveTo',
        'lineTo',
        'quadraticCurveTo',
        'bezierCurveTo',
        'rect',
        'clip',
        'strokeRect',
        'setTransform',
      ].map((name) => [name, noop]),
    ),
    fillText: (text: unknown) => texts.push(text),
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, texts };
}

const SIZE = 200;

/** Draws the shop at `time`, with the pointer over swatch `n` and pressed `presses` times. */
function frame(time: number, n?: number, presses = 0) {
  const { ctx, texts } = recorder();
  const box = swatchBox(n ?? 0);
  const pointer =
    n === undefined
      ? undefined
      : {
          x: ((box.x + box.w / 2) * SIZE) / 100,
          y: ((box.y + box.h / 2) * SIZE) / 100,
          down: presses > 0,
          presses,
        };
  giftShop.draw(ctx, SIZE, time, pointer);
  return texts.map(String);
}

describe('the drawing', () => {
  it('asks for the paper, then the ribbon, then the bow, and shows the tag once wrapped', () => {
    expect(frame(0)).toContain('Pick the paper for Stocking stuffer');
    expect(frame(100, 1)).toContain('Pick the paper for Stocking stuffer');
    expect(frame(200, 1, 1)).toContain('Pick the ribbon for Stocking stuffer');
    expect(frame(300, 2, 1)).toContain('Pick the bow for Stocking stuffer');
    const wrapped = frame(400, 3, 1);
    expect(wrapped).toContain('Stocking stuffer, wrapped!');
    expect(wrapped).toContain('Tap to wrap the next one');
    // A tap puts the tag away, and the next gift is on the counter.
    const next = frame(500, 0, 1);
    expect(next).toContain('Pick the paper for Tidy elf');
    expect(next).toContain('1 of 12 on the shelves');
  });

  it('counts every press since the last frame', () => {
    expect(frame(10_000, 0, 2)).toContain('Pick the bow for Tidy elf');
  });
});
