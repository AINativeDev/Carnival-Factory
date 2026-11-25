import { describe, expect, it } from 'vitest';
import { toScreen, toTile } from './world';

describe('the isometric projection', () => {
  it('puts the town square in the middle and tiles a diamond apart', () => {
    expect(toScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(toScreen({ x: 1, y: 0 })).toEqual({ x: 32, y: 16 });
    expect(toScreen({ x: 0, y: 1 })).toEqual({ x: -32, y: 16 });
  });

  it('turns a point on screen back into the tile under it', () => {
    for (const tile of [
      { x: 3, y: -2 },
      { x: -7, y: 11 },
      { x: 0.5, y: 0.25 },
    ]) {
      const back = toTile(toScreen(tile));
      expect(back.x).toBeCloseTo(tile.x);
      expect(back.y).toBeCloseTo(tile.y);
    }
  });
});
