import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from './test-support/recording-canvas';
import { drawBeat, STILL } from './intro-scene';

/**
 * Pins every call each beat's diorama makes through its loops: the elf's tapping
 * feet and its letter's lines, the workshop's smoke and gear, and the stall from
 * the empty spot through its pop and sparkles to standing. So any change to how
 * a scene is drawn shows up here.
 */
const TIMES = [0, 0.37, 1, 1.2, 1.45, 1.6, 1.9, 2.3, 2.6, STILL, 3.9, 5.3, 11.7];

const beatDrawn = (beat: number) =>
  fingerprint(
    drawingOf((ctx) => {
      for (const time of TIMES) drawBeat(ctx, beat, 240, time);
    }),
  );

describe("the intro's scenes, call by call", () => {
  it('draws the elf writing its letter', () => {
    expect(beatDrawn(0)).toMatchInlineSnapshot(`"4048e40f21026190 (4155 calls)"`);
  });

  it('draws the workshop humming', () => {
    expect(beatDrawn(1)).toMatchInlineSnapshot(`"d78eb06ef1576c72 (4953 calls)"`);
  });

  it('draws the stall popping up on its spot', () => {
    expect(beatDrawn(2)).toMatchInlineSnapshot(`"89817d34786ea77a (4809 calls)"`);
  });
});
