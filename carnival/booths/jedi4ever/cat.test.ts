import { describe, expect, it } from 'vitest';
import { glintAt, LANDING, twitchAt, TWITCH } from './cat';
import { letterAt, LOOP, SLOT } from './letters';

describe('the cat', () => {
  it('sleeps still until a letter lands', () => {
    expect(twitchAt(LANDING - 1)).toBe(0);
    expect(twitchAt(LANDING + TWITCH)).toBe(0);
    expect(twitchAt(LANDING + SLOT - 1)).toBe(0);
  });

  it('twitches in the moment after each letter lands, then settles', () => {
    for (let slot = 0; slot < 4; slot++) {
      const landed = slot * SLOT + LANDING;
      expect(twitchAt(landed + TWITCH / 2)).toBeCloseTo(1);
      expect(twitchAt(landed + TWITCH / 4)).toBeGreaterThan(0);
      expect(twitchAt(landed + TWITCH / 4)).toBeLessThan(1);
    }
  });

  it('lines up with the letter reaching the pile', () => {
    expect(letterAt(0, LANDING)?.stage).toBe('carry');
    expect(letterAt(0, LANDING - 1)?.stage).toBe('drop');
  });

  it('repeats every round, and before the page loaded', () => {
    expect(twitchAt(LANDING + TWITCH / 2 + LOOP)).toBeCloseTo(twitchAt(LANDING + TWITCH / 2));
    expect(twitchAt(LANDING + TWITCH / 2 - LOOP)).toBeCloseTo(1);
  });

  it('glints the bell once per tail flick, at its peak, and never while asleep', () => {
    expect(glintAt(LANDING - 1)).toBe(0);
    expect(glintAt(LANDING + TWITCH)).toBe(0);
    for (let slot = 0; slot < 4; slot++) {
      const peak = slot * SLOT + LANDING + TWITCH / 2;
      expect(glintAt(peak)).toBeCloseTo(1);
      expect(glintAt(peak + TWITCH / 4)).toBe(0);
      expect(glintAt(peak - TWITCH / 4)).toBe(0);
    }
  });
});
