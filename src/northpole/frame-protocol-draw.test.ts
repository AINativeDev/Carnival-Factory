import { describe, expect, it } from 'vitest';
import { MAX_SIZE, readDrawRequest, readPointer } from './frame-protocol';
import { MAX_PRESSES } from './square';

describe('readDrawRequest', () => {
  it('reads a whole size in range and a finite time', () => {
    expect(readDrawRequest({ type: 'draw', size: 160, time: 12.5 })).toEqual({
      type: 'draw',
      size: 160,
      time: 12.5,
    });
  });

  it('refuses sizes and times that could hurt', () => {
    for (const size of [0, -1, 1.5, MAX_SIZE + 1, '160', NaN]) {
      expect(readDrawRequest({ type: 'draw', size, time: 0 }), String(size)).toBeUndefined();
    }
    expect(readDrawRequest({ type: 'draw', size: 10, time: Infinity })).toBeUndefined();
    expect(readDrawRequest({ type: 'paint', size: 10, time: 0 })).toBeUndefined();
  });

  it('passes on a pointer within the square', () => {
    expect(
      readDrawRequest({
        type: 'draw',
        size: 100,
        time: 0,
        pointer: { x: 0, y: 100, down: true, presses: 2 },
      }),
    ).toEqual({
      type: 'draw',
      size: 100,
      time: 0,
      pointer: { x: 0, y: 100, down: true, presses: 2 },
    });
  });

  it('draws without a malformed pointer', () => {
    for (const pointer of [
      { x: 101, y: 5, down: false, presses: 0 },
      { x: -1, y: 5, down: false, presses: 0 },
      { x: 5, y: NaN, down: false, presses: 0 },
      { x: 5, y: Infinity, down: false, presses: 0 },
      { x: '5', y: 5, down: false, presses: 0 },
      { x: 5, y: 5, down: 'yes', presses: 0 },
      { x: 5, y: 5, presses: 0 },
      { x: 5, y: 5, down: false },
      { x: 5, y: 5, down: true, presses: -1 },
      { x: 5, y: 5, down: true, presses: 1.5 },
      { x: 5, y: 5, down: true, presses: 21 },
      { x: 5, y: 5, down: true, presses: NaN },
      { x: 5, y: 5, down: true, presses: '1' },
      [5, 5, true],
      'here',
      null,
    ]) {
      expect(
        readDrawRequest({ type: 'draw', size: 100, time: 0, pointer }),
        JSON.stringify(pointer),
      ).toEqual({ type: 'draw', size: 100, time: 0 });
    }
  });
});

describe("readDrawRequest's keys", () => {
  it('passes on the keys heard, beside a pointer or alone, and drops a list it cannot read', () => {
    const pointer = { x: 1, y: 2, down: false, presses: 0 };
    expect(readDrawRequest({ type: 'draw', size: 10, time: 1, keys: ['left'] })).toEqual({
      type: 'draw',
      size: 10,
      time: 1,
      keys: ['left'],
    });
    expect(readDrawRequest({ type: 'draw', size: 10, time: 1, pointer, keys: ['up'] })).toEqual({
      type: 'draw',
      size: 10,
      time: 1,
      pointer,
      keys: ['up'],
    });
    expect(readDrawRequest({ type: 'draw', size: 10, time: 1, keys: ['ArrowUp'] })).toEqual({
      type: 'draw',
      size: 10,
      time: 1,
    });
  });
});

describe('readPointer', () => {
  it('keeps only x, y, down and presses', () => {
    const pointer = { x: 1, y: 2, down: false, presses: 3, event: {}, toString: () => 'x' };
    expect(readPointer(pointer, 10)).toEqual({ x: 1, y: 2, down: false, presses: 3 });
    expect(Object.keys(readPointer(pointer, 10) ?? {})).toEqual(['x', 'y', 'down', 'presses']);
  });

  it("refuses what's outside the square", () => {
    expect(readPointer({ x: 10, y: 10, down: false, presses: 0 }, 10)).toEqual({
      x: 10,
      y: 10,
      down: false,
      presses: 0,
    });
    expect(readPointer({ x: 10.01, y: 0, down: false, presses: 0 }, 10)).toBeUndefined();
    expect(readPointer(undefined, 10)).toBeUndefined();
  });

  it('takes a whole number of presses from 0 to MAX_PRESSES', () => {
    expect(readPointer({ x: 1, y: 1, down: false, presses: MAX_PRESSES }, 10)?.presses).toBe(
      MAX_PRESSES,
    );
    expect(readPointer({ x: 1, y: 1, down: false, presses: MAX_PRESSES + 1 }, 10)).toBeUndefined();
  });
});
