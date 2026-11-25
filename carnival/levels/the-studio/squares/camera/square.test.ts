import { describe, expect, it } from 'vitest';
import { BLINK, recording } from './square';

describe('recording', () => {
  it('blinks the red light on, then off', () => {
    expect(recording(0)).toBe(true);
    expect(recording(BLINK * 0.75)).toBe(false);
    expect(recording(BLINK)).toBe(true);
    expect(recording(-BLINK / 4)).toBe(false);
  });
});
