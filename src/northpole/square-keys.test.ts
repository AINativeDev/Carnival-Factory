import { describe, expect, it } from 'vitest';
import { MAX_KEYS, readKeys, squareKey } from './square-keys';

describe('the keys a square hears', () => {
  it('are the arrows, Enter and Space, by plain names', () => {
    expect(
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].map(squareKey),
    ).toEqual(['left', 'right', 'up', 'down', 'enter', 'space']);
  });

  it('are never any other key, or a name off the list', () => {
    for (const key of ['Escape', 'e', 'Tab', 'left', 'constructor', 'toString', ''])
      expect(squareKey(key), key).toBeUndefined();
  });
});

describe('the keys in a message', () => {
  it('are a list of known names, up to the most a frame carries', () => {
    expect(readKeys(['left', 'right', 'up', 'down', 'enter', 'space'])).toEqual([
      'left',
      'right',
      'up',
      'down',
      'enter',
      'space',
    ]);
    expect(readKeys(Array.from({ length: MAX_KEYS }, () => 'right'))).toHaveLength(MAX_KEYS);
  });

  it('are nothing when the list is empty, too long, or holds anything else', () => {
    for (const keys of [
      [],
      Array.from({ length: MAX_KEYS + 1 }, () => 'right'),
      ['right', 'ArrowLeft'],
      ['right', 7],
      'right',
      { 0: 'right', length: 1 },
      undefined,
    ])
      expect(readKeys(keys), JSON.stringify(keys)).toBeUndefined();
  });
});
