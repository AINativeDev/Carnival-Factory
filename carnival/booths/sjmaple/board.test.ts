import { describe, expect, it } from 'vitest';
import { BUTTONS, buttonAt, PLACES } from './board';

describe('buttonAt', () => {
  it('finds each button from a point inside it, and nothing outside them', () => {
    for (const b of BUTTONS) {
      expect(buttonAt(b.x + b.w / 2, b.y + b.h / 2)).toBe(b.name);
    }
    expect(buttonAt(PLACES.mat.x, PLACES.mat.y)).toBeNull();
    expect(buttonAt(-1, -1)).toBeNull();
  });
});
