import { describe, expect, it } from 'vitest';
import { readStall, stallFor } from './frame-protocol';
import { LANDMARKS, STALL_SHAPES } from './square';

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
describe('readStall: a landmark', () => {
  it("keeps a landmark the map knows, and a tower's letters", () => {
    for (const landmark of LANDMARKS)
      expect(readStall({ shape: 'shed', roof: 'gold', landmark })).toEqual({
        shape: 'shed',
        roof: 'gold',
        landmark,
      });
    expect(readStall({ shape: 'shed', roof: 'gold', landmark: 'tower', letters: 'TESSL' })).toEqual(
      { shape: 'shed', roof: 'gold', landmark: 'tower', letters: 'TESSL' },
    );
  });

  it('drops the whole option for an unknown landmark or letters that are not one to six capitals', () => {
    for (const landmark of ['castle', 'Tower', '', 7, null, ['tower']])
      expect(readStall({ shape: 'shed', roof: 'gold', landmark })).toBeUndefined();
    for (const letters of ['', 'tessl', 'TOOLONGX', '<b>', 7, null])
      expect(
        readStall({ shape: 'shed', roof: 'gold', landmark: 'tower', letters }),
      ).toBeUndefined();
  });
});

describe('stallFor: only an attraction stands as a landmark', () => {
  const asked = { shape: 'tent', roof: 'berry', landmark: 'big-top', letters: 'TOP' } as const;

  it("keeps an attraction's landmark", () => {
    expect(stallFor('attraction', asked)).toEqual(asked);
  });

  it("drops a booth's or a level square's landmark, keeping its stall", () => {
    for (const kind of ['booth', 'level'] as const)
      expect(stallFor(kind, asked)).toEqual({ shape: 'tent', roof: 'berry' });
    expect(stallFor('booth', undefined)).toBeUndefined();
    expect(stallFor('booth', { ...asked, trim: 'gold' })).toEqual({
      shape: 'tent',
      roof: 'berry',
      trim: 'gold',
    });
  });
});
