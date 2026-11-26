import { describe, expect, it } from 'vitest';
import { fadeAt, roomArea } from './interior';

describe('the space a square stands in', () => {
  it('is beside the panel on a laptop, and above it on a phone', () => {
    expect(roomArea(1280, 720)).toEqual({ x: 0, y: 0, w: 900, h: 720 });
    expect(roomArea(390, 760)).toEqual({ x: 0, y: 0, w: 390, h: 760 * 0.55 });
  });
});

describe('the fade in and out', () => {
  it('goes dark halfway, and is clear before and after', () => {
    expect(fadeAt(-1, 500)).toBe(0);
    expect(fadeAt(0, 500)).toBe(0);
    expect(fadeAt(250, 500)).toBe(1);
    expect(fadeAt(125, 500)).toBeCloseTo(0.5);
    expect(fadeAt(500, 500)).toBe(0);
  });
});
