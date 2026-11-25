import { describe, expect, it } from 'vitest';
import { promptSpot } from './prompt-spot';

const frame = { width: 390, height: 480 };
const size = { w: 180, h: 40 };
/** The way home in a level's top-left corner, as the page lays it out. */
const home = { x: 12, y: 12, w: 193, h: 29 };

describe('where the call to action sits', () => {
  it('sits centred above its anchor, its foot on it', () => {
    expect(promptSpot({ x: 200, y: 300 }, size, frame, [])).toEqual({ x: 110, y: 260 });
  });

  it('stays on the frame, 8 pixels in from every edge', () => {
    expect(promptSpot({ x: 0, y: 0 }, size, frame, [])).toEqual({ x: 8, y: 8 });
    expect(promptSpot({ x: 999, y: 999 }, size, frame, [])).toEqual({ x: 202, y: 432 });
  });

  it('steps below a corner link it would cover, so the way home can still be clicked', () => {
    expect(promptSpot({ x: 60, y: 20 }, size, frame, [home])).toEqual({ x: 8, y: 49 });
  });

  it('leaves a corner link alone when it is clear of it, beside or below', () => {
    const wide = { width: 600, height: 480 };
    expect(promptSpot({ x: 400, y: 20 }, size, wide, [home])).toEqual({ x: 310, y: 8 });
    expect(promptSpot({ x: 60, y: 200 }, size, frame, [home])).toEqual({ x: 8, y: 160 });
  });
});
