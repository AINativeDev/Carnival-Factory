import { describe, expect, it } from 'vitest';
import { CHASE, gumdropLit } from './plot';

const litAt = (time: number) => Array.from({ length: 9 }, (_, i) => gumdropLit(i, 9, time));

describe('gumdropLit', () => {
  it('keeps all but two lights lit', () => {
    for (let time = 0; time < CHASE; time += 100) {
      expect(litAt(time).filter(Boolean)).toHaveLength(7);
    }
  });

  it('runs the dark gap along the string', () => {
    expect(litAt(0).slice(0, 2)).toEqual([false, true]);
    expect(litAt(CHASE / 2).indexOf(false)).toBeGreaterThan(2);
  });

  it('starts again after a full chase', () => {
    expect(litAt(CHASE)).toEqual(litAt(0));
  });
});
