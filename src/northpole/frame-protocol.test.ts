import { describe, expect, it } from 'vitest';
import { MAX_DESCRIPTION, MAX_NAME, readFrameMessage } from './frame-protocol';

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
