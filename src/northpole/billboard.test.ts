import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { BILLBOARD, billboardBox, BOARD, drawBillboard, lampGlow, onBillboard } from './billboard';

const foot = { x: 100, y: 300 };

describe('the AI DevCon billboard', () => {
  it('says what is next, where and when, and how to get tickets', () => {
    const texts = drawingOf((ctx) => {
      drawBillboard(ctx, foot, 0);
    })
      .filter(([name]) => name === 'fillText')
      .map(([, text]) => text);
    expect(texts).toEqual([
      'AI DevCon',
      'Next in London',
      '7–8 June 2027 · The Brewery',
      'Get tickets →',
    ]);
    expect(BILLBOARD.room).toBe('ai-devcon');
  });

  it('is hit by a click on the board or its posts, and nowhere else', () => {
    expect(onBillboard(foot, { x: 100, y: 300 - BOARD.post - BOARD.h / 2 })).toBe(true);
    expect(onBillboard(foot, { x: 100, y: 310 })).toBe(false);
    expect(onBillboard(foot, { x: 100 + BOARD.w, y: 250 })).toBe(false);
    expect(billboardBox(foot)).toEqual({ x: -10, y: 92, w: 220, h: 208 });
    // Its edges count as on it; a pixel past any of them doesn't.
    for (const edge of [
      { x: -10, y: 92 },
      { x: 210, y: 300 },
    ])
      expect(onBillboard(foot, edge)).toBe(true);
    for (const past of [
      { x: -11, y: 200 },
      { x: 211, y: 200 },
      { x: 100, y: 91 },
      { x: 100, y: 301 },
    ])
      expect(onBillboard(foot, past)).toBe(false);
  });

  it('breathes its lamps slowly, never flickering', () => {
    expect(lampGlow(0)).toBeCloseTo(0.8);
    expect(lampGlow(1500 * (Math.PI / 2))).toBeCloseTo(1);
    expect(lampGlow(-1500 * (Math.PI / 2))).toBeCloseTo(0.6);
    for (let t = 0; t < 3000; t += 100)
      expect(Math.abs(lampGlow(t + 100) - lampGlow(t))).toBeLessThan(0.02);
  });

  it('draws the same at the same time', () => {
    const at = (time: number) =>
      fingerprint(
        drawingOf((ctx) => {
          drawBillboard(ctx, foot, time);
        }),
      );
    expect(at(500)).toBe(at(500));
    expect([at(0), at(2500)]).toMatchInlineSnapshot(`
      [
        "9165db5f4fe8c06f (241 calls)",
        "885658944d8c614a (241 calls)",
      ]
    `);
  });

  it('shrinks a line too wide for the board to fit it, and never grows one', () => {
    const scales = (width: number) =>
      drawingOf((ctx) => {
        const measured = new Proxy(ctx, {
          get: (target, key) =>
            key === 'measureText' ? () => ({ width }) : (Reflect.get(target, key) as unknown),
        });
        drawBillboard(measured, foot, 0);
      })
        .filter(([name]) => name === 'scale')
        .map(([, by]) => by);
    expect(scales(10)).toEqual([1, 1, 1, 1]);
    expect(scales(1000)).toEqual([0.1892, 0.176, 0.1892, 0.08316]);
  });
});
