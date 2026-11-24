import { describe, expect, it } from 'vitest';
import {
  MAX_DESCRIPTION,
  MAX_NAME,
  MAX_SIZE,
  readDrawRequest,
  readPointer,
  readFrameAddress,
  readFrameMessage,
  readStall,
} from './frame-protocol';
import { MAX_PRESSES, STALL_SHAPES } from './square';

/** Stands in for an ImageBitmap in Node, where there is none. */
class FakeBitmap {
  constructor(
    public width: number,
    public height: number,
  ) {}
}
const isBitmap = (value: unknown): value is ImageBitmap => value instanceof FakeBitmap;
const bitmap = (size: number) => new FakeBitmap(size, size) as unknown as ImageBitmap;

describe('readFrameMessage', () => {
  it('ignores anything that is not one of the messages', () => {
    for (const data of [null, undefined, 'ready', 42, [], {}, { type: 'hello' }]) {
      expect(readFrameMessage(data, 160, isBitmap)).toBeUndefined();
    }
  });

  it('reads ready, tidying and capping the name and description', () => {
    expect(
      readFrameMessage(
        { type: 'ready', name: '  Penguin\n  Pond ', description: 'x'.repeat(500) },
        undefined,
        isBitmap,
      ),
    ).toEqual({ type: 'ready', name: 'Penguin Pond', description: 'x'.repeat(MAX_DESCRIPTION) });
    const long = readFrameMessage({ type: 'ready', name: 'n'.repeat(99) }, undefined, isBitmap);
    expect(long).toMatchObject({ name: 'n'.repeat(MAX_NAME), description: '' });
  });

  it('refuses ready without a name, or with one that is not text', () => {
    expect(readFrameMessage({ type: 'ready', name: '   ' }, undefined, isBitmap)).toBeUndefined();
    expect(
      readFrameMessage({ type: 'ready', name: { x: 1 } }, undefined, isBitmap),
    ).toBeUndefined();
  });

  it('carries a valid stall option on ready, and drops an invalid one', () => {
    const ready = (stall: unknown) =>
      readFrameMessage({ type: 'ready', name: 'Shed', stall }, undefined, isBitmap);
    expect(ready({ shape: 'shed', roof: 'gold' })).toEqual({
      type: 'ready',
      name: 'Shed',
      description: '',
      stall: { shape: 'shed', roof: 'gold' },
    });
    expect(ready({ shape: 'castle', roof: 'gold' })).toEqual({
      type: 'ready',
      name: 'Shed',
      description: '',
    });
  });

  it('takes a frame only as a bitmap of the size the map asked for', () => {
    expect(readFrameMessage({ type: 'frame', bitmap: bitmap(160) }, 160, isBitmap)).toMatchObject({
      type: 'frame',
      drawMs: 0,
    });
    expect(
      readFrameMessage({ type: 'frame', bitmap: bitmap(4096) }, 160, isBitmap),
    ).toBeUndefined();
    expect(
      readFrameMessage({ type: 'frame', bitmap: bitmap(160) }, undefined, isBitmap),
    ).toBeUndefined();
    expect(
      readFrameMessage({ type: 'frame', bitmap: { width: 160, height: 160 } }, 160, isBitmap),
    ).toBeUndefined();
  });

  it('keeps a frame’s draw time sane', () => {
    const read = (drawMs: unknown) =>
      readFrameMessage({ type: 'frame', bitmap: bitmap(10), drawMs }, 10, isBitmap);
    expect(read(3.5)).toMatchObject({ drawMs: 3.5 });
    expect(read(-1)).toMatchObject({ drawMs: 0 });
    expect(read(Infinity)).toMatchObject({ drawMs: 0 });
    expect(read('fast')).toMatchObject({ drawMs: 0 });
  });

  it('reads an error as text, capped', () => {
    expect(readFrameMessage({ type: 'error', message: 'boom' }, 160, isBitmap)).toEqual({
      type: 'error',
      message: 'boom',
    });
    expect(readFrameMessage({ type: 'error' }, 160, isBitmap)).toEqual({
      type: 'error',
      message: '',
    });
  });
});

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

describe('readPointer', () => {
  it('keeps only x, y, down and presses', () => {
    const pointer = { x: 1, y: 2, down: false, presses: 3, event: {}, toString: () => 'x' };
    expect(readPointer(pointer, 10)).toEqual({ x: 1, y: 2, down: false, presses: 3 });
    expect(Object.keys(readPointer(pointer, 10)!)).toEqual(['x', 'y', 'down', 'presses']);
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

describe('readFrameAddress', () => {
  it('reads a booth or an attraction', () => {
    expect(readFrameAddress('#booth/jedi4ever')).toEqual({ kind: 'booth', id: 'jedi4ever' });
    expect(readFrameAddress('#attraction/ferris-wheel')).toEqual({
      kind: 'attraction',
      id: 'ferris-wheel',
    });
  });

  it("checks each id by its own kind's rules", () => {
    const long = 'a-very-long-attraction-name-that-is-well-over-forty-characters';
    expect(readFrameAddress(`#attraction/${long}`)).toEqual({ kind: 'attraction', id: long });
    expect(readFrameAddress(`#booth/${long}`)).toBeUndefined();
    expect(readFrameAddress('#attraction/a--b')).toBeUndefined();
  });

  it('refuses anything else', () => {
    for (const hash of [
      '',
      '#booth/',
      '#plot/jedi4ever',
      '#booth/../northpole',
      '#booth/Jedi4ever',
      '#booth/-elf',
      '#booth/a/b',
    ]) {
      expect(readFrameAddress(hash), hash).toBeUndefined();
    }
  });
});

describe('readStall', () => {
  it('reads every shape the map knows, with theme colours', () => {
    for (const shape of STALL_SHAPES) {
      expect(readStall({ shape, roof: 'gold' })).toEqual({ shape, roof: 'gold' });
    }
    expect(readStall({ shape: 'tent', roof: 'berry', trim: 'snow' })).toEqual({
      shape: 'tent',
      roof: 'berry',
      trim: 'snow',
    });
  });

  it('keeps only the shape, roof and trim', () => {
    expect(readStall({ shape: 'cabin', roof: 'pine', draw: 'x', onclick: 1 })).toEqual({
      shape: 'cabin',
      roof: 'pine',
    });
  });

  it('refuses shapes the map does not know', () => {
    for (const shape of ['castle', 'Shed', ' shed', '', 3, undefined, null, ['shed']]) {
      expect(readStall({ shape, roof: 'gold' })).toBeUndefined();
    }
  });

  it('refuses colours that are not theme colour names', () => {
    for (const roof of ['#ff0000', 'red', 'Gold', 'toString', '__proto__', '', 7, undefined]) {
      expect(readStall({ shape: 'shed', roof })).toBeUndefined();
    }
    for (const trim of ['#fff', 'constructor', null, 0]) {
      expect(readStall({ shape: 'shed', roof: 'gold', trim })).toBeUndefined();
    }
  });

  it('refuses anything that is not an object', () => {
    for (const value of [null, undefined, 'shed', 42, true]) {
      expect(readStall(value)).toBeUndefined();
    }
  });
});
