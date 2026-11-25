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
    expect(BILLBOARD.tickets).toBe('https://luma.com/aidevcon-ldn2027');
  });

  it('is hit by a click on the board or its posts, and nowhere else', () => {
    expect(onBillboard(foot, { x: 100, y: 300 - BOARD.post - BOARD.h / 2 })).toBe(true);
    expect(onBillboard(foot, { x: 100, y: 310 })).toBe(false);
    expect(onBillboard(foot, { x: 100 + BOARD.w, y: 250 })).toBe(false);
    expect(billboardBox(foot)).toEqual({ x: 5, y: 150, w: 190, h: 150 });
  });

  it('breathes its lamps slowly, never flickering', () => {
    expect(lampGlow(0)).toBeCloseTo(0.8);
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
  });
});
