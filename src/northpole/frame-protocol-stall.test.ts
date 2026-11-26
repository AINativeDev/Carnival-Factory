import { describe, expect, it } from 'vitest';
import { readStall, stallFor } from './frame-protocol';
import { LANDMARKS, SCENES, STALL_SHAPES } from './square';

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

  it("keeps a level square's display, never a booth's (ADR 0040)", () => {
    const item = { shape: 'kiosk', roof: 'mint', display: true } as const;
    expect(stallFor('level', item)).toEqual(item);
    expect(stallFor('booth', item)).toEqual({ shape: 'kiosk', roof: 'mint' });
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

describe('readStall: a display (ADR 0040)', () => {
  it('keeps it only when it is true', () => {
    expect(readStall({ shape: 'kiosk', roof: 'mint', display: true })).toEqual({
      shape: 'kiosk',
      roof: 'mint',
      display: true,
    });
    expect(readStall({ shape: 'kiosk', roof: 'mint', display: false })).toEqual({
      shape: 'kiosk',
      roof: 'mint',
    });
  });

  it('drops the whole option for anything but a boolean', () => {
    for (const display of ['yes', 1, null, {}])
      expect(readStall({ shape: 'kiosk', roof: 'mint', display })).toBeUndefined();
  });

  it('keeps the mood any square chooses inside, a booth too', () => {
    const moody = { shape: 'cabin', roof: 'wood', scene: 'chiaroscuro' } as const;
    expect(stallFor('booth', moody)).toEqual(moody);
    expect(stallFor('level', moody)).toEqual(moody);
  });
});

describe('readStall: the mood inside', () => {
  it('keeps a known scene, and drops a stall with an unknown one', () => {
    for (const scene of SCENES)
      expect(readStall({ shape: 'shed', roof: 'gold', scene })).toEqual({
        shape: 'shed',
        roof: 'gold',
        scene,
      });
    expect(readStall({ shape: 'shed', roof: 'gold', scene: 'disco' })).toBeUndefined();
  });
});
