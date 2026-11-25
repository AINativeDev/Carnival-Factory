import { describe, expect, it } from 'vitest';
import { readFrameAddress } from './frame-protocol';

describe('readFrameAddress', () => {
  it("reads a level's own square, each part checked", () => {
    expect(readFrameAddress('#level/jedi4ever/cocoa-hut')).toEqual({
      kind: 'level',
      id: 'cocoa-hut',
      level: 'jedi4ever',
    });
    expect(readFrameAddress('#level/jedi4ever/a--b')).toBeUndefined();
    expect(readFrameAddress('#level/-x/hut')).toBeUndefined();
    expect(readFrameAddress('#level/jedi4ever/../booths')).toBeUndefined();
  });

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
