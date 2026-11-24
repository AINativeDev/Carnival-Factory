import { describe, expect, it } from 'vitest';
import { isTap, onMapping, onRect, rescale, withOwedPress } from './pointer';

describe('onMapping', () => {
  // A stall's front: its top edge runs down and to the right, its sides stand upright.
  const face = { origin: { x: 100, y: 50 }, u: { x: 80, y: 40 }, v: { x: 0, y: 80 } };
  const at = (x: number, y: number, size: number) => ({
    x: face.origin.x + (face.u.x * x) / size + (face.v.x * y) / size,
    y: face.origin.y + (face.u.y * x) / size + (face.v.y * y) / size,
  });

  it("finds the square's own coordinates through the face's slant", () => {
    expect(onMapping(face.origin, face, 200)).toEqual({ x: 0, y: 0 });
    for (const [x, y] of [
      [200, 200],
      [50, 150],
      [123.5, 7],
    ]) {
      const found = onMapping(at(x, y, 200), face, 200)!;
      expect(found.x).toBeCloseTo(x);
      expect(found.y).toBeCloseTo(y);
    }
  });

  it('turns with a face that slopes the other way', () => {
    const other = { origin: { x: 100, y: 50 }, u: { x: 80, y: -40 }, v: { x: 0, y: 80 } };
    const found = onMapping({ x: 140, y: 70 }, other, 100)!;
    expect(found.x).toBeCloseTo(50);
    expect(found.y).toBeCloseTo(50);
  });

  it('works for any rotation and size', () => {
    const turn = Math.PI / 5;
    const turned = {
      origin: { x: -20, y: 30 },
      u: { x: Math.cos(turn) * 60, y: Math.sin(turn) * 60 },
      v: { x: -Math.sin(turn) * 60, y: Math.cos(turn) * 60 },
    };
    const point = {
      x: -20 + Math.cos(turn) * 30 - Math.sin(turn) * 15,
      y: 30 + Math.sin(turn) * 30 + Math.cos(turn) * 15,
    };
    const found = onMapping(point, turned, 64)!;
    expect(found.x).toBeCloseTo(32);
    expect(found.y).toBeCloseTo(16);
  });

  it('gives undefined beside the square, or on a face seen edge on', () => {
    expect(onMapping({ x: 99, y: 60 }, face, 100)).toBeUndefined();
    expect(onMapping({ x: 140, y: 69 }, face, 100)).toBeUndefined();
    expect(onMapping(at(100, 101, 100), face, 100)).toBeUndefined();
    const flat = { origin: { x: 0, y: 0 }, u: { x: 10, y: 0 }, v: { x: 20, y: 0 } };
    expect(onMapping({ x: 5, y: 0 }, flat, 100)).toBeUndefined();
  });
});

describe('onRect', () => {
  it('scales a point on a canvas shown at another size', () => {
    expect(onRect({ x: 60, y: 110 }, { x: 10, y: 10, w: 200, h: 200 }, 480)).toEqual({
      x: 120,
      y: 240,
    });
  });

  it('gives undefined outside it', () => {
    expect(onRect({ x: 9, y: 50 }, { x: 10, y: 10, w: 200, h: 200 }, 480)).toBeUndefined();
    expect(onRect({ x: 50, y: 211 }, { x: 10, y: 10, w: 200, h: 200 }, 480)).toBeUndefined();
    expect(onRect({ x: 0, y: 0 }, { x: 0, y: 0, w: 0, h: 0 }, 480)).toBeUndefined();
  });
});

describe('rescale', () => {
  it('scales to the size the square draws at, and stays within it', () => {
    expect(rescale({ x: 50, y: 100, down: true }, 100, 64)).toEqual({ x: 32, y: 64, down: true });
    expect(rescale({ x: 100.4, y: -0.1, down: false }, 100.4, 100)).toEqual({
      x: 100,
      y: 0,
      down: false,
    });
  });
});

describe('isTap', () => {
  it('counts a press that barely moved as a click, and a drag as not', () => {
    expect(isTap({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(true);
    expect(isTap({ x: 0, y: 0 }, { x: 9, y: 0 })).toBe(false);
  });
});

describe('withOwedPress', () => {
  const tap = { x: 10, y: 20, down: true };

  it('sends the pointer as it is when no press is owed', () => {
    expect(withOwedPress({ x: 1, y: 2, down: false }, undefined)).toEqual({
      x: 1,
      y: 2,
      down: false,
    });
    expect(withOwedPress(undefined, undefined)).toBeUndefined();
  });

  it('keeps a press the square missed, where the pointer is now', () => {
    expect(withOwedPress({ x: 1, y: 2, down: false }, tap)).toEqual({ x: 1, y: 2, down: true });
  });

  it('sends the press itself when the pointer has gone since', () => {
    expect(withOwedPress(undefined, tap)).toEqual(tap);
  });
});
