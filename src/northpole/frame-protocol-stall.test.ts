import { describe, expect, it } from 'vitest';
import { readStall } from './frame-protocol';
import { STALL_SHAPES } from './square';

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
