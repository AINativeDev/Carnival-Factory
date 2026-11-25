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
describe('readStall: a tower', () => {
  it('keeps one to six capitals', () => {
    expect(readStall({ shape: 'shed', roof: 'gold', tower: 'TESSL' })).toEqual({
      shape: 'shed',
      roof: 'gold',
      tower: 'TESSL',
    });
    expect(readStall({ shape: 'shed', roof: 'gold', trim: 'cocoa', tower: 'A' })?.tower).toBe('A');
  });

  it('drops the whole option for anything else', () => {
    for (const tower of ['', 'tessl', 'TOOLONGX', '<b>', 7, null])
      expect(readStall({ shape: 'shed', roof: 'gold', tower })).toBeUndefined();
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
});
