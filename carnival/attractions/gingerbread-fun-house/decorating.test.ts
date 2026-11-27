import { describe, expect, it } from 'vitest';
import {
  bare,
  decorate,
  EDGE,
  lean,
  LEAN_FROM,
  MOST,
  onHouse,
  POP,
  popScale,
  TREATS,
  wobble,
  WOBBLE,
} from './decorating';

describe('the leaning house and its treats', () => {
  it('sticks a gumdrop, an icing swirl and a candy in turn, one a right note', () => {
    let house = bare();
    for (let tap = 0; tap < 4; tap++) house = decorate(house, 40, 50, tap * 1000);
    expect(house.placed.map((placed) => placed.treat)).toEqual([...TREATS, 'gumdrop']);
    expect(house.placed.map((placed) => placed.tint)).toEqual([0, 1, 2, 3]);
    expect(house.count).toBe(4);
  });

  it('keeps the newest treats once the house is full', () => {
    let house = bare();
    for (let tap = 0; tap < MOST + 5; tap++) house = decorate(house, 40, 50, tap);
    expect(house.placed).toHaveLength(MOST);
    expect(house.count).toBe(MOST + 5);
    expect(house.placed[0]?.tint).toBe(5);
  });

  it('keeps every treat whole inside the square, however the house sways', () => {
    // Its glow at the top of its pop, scaled like the drawing, reaches this far from its middle.
    const reach = 3.5 * Math.max(...Array.from({ length: POP + 1 }, (_, t) => popScale(0, t)));
    for (const [x, y] of [
      [0, 0],
      [100, 0],
      [0, 100],
      [100, 100],
      [1, 50],
    ] as const) {
      const placed = decorate(bare(), x, y, 0).placed[0] ?? { x: -1, y: -1 };
      for (let time = 0; time < 10000; time += 250) {
        // Where the swaying house carries the treat on the screen at `time`.
        const turn = lean(time);
        const dx = placed.x - LEAN_FROM.x;
        const dy = placed.y - LEAN_FROM.y;
        const sx = LEAN_FROM.x + dx * Math.cos(turn) - dy * Math.sin(turn);
        const sy = LEAN_FROM.y + dx * Math.sin(turn) + dy * Math.cos(turn);
        for (const at of [sx, sy]) {
          expect(at - reach).toBeGreaterThanOrEqual(0);
          expect(at + reach).toBeLessThanOrEqual(100);
        }
      }
    }
    expect(EDGE).toBeLessThan(15);
  });

  it('turns a tap back onto the leaning house', () => {
    for (const turn of [0, -0.04, 0.08]) {
      const spot = onHouse(30, 45, turn);
      const dx = spot.x - LEAN_FROM.x;
      const dy = spot.y - LEAN_FROM.y;
      expect(LEAN_FROM.x + dx * Math.cos(turn) - dy * Math.sin(turn)).toBeCloseTo(30);
      expect(LEAN_FROM.y + dx * Math.sin(turn) + dy * Math.cos(turn)).toBeCloseTo(45);
    }
    expect(onHouse(LEAN_FROM.x, LEAN_FROM.y, 0.05)).toEqual(LEAN_FROM);
  });

  it('leans only a little, and always the same way', () => {
    for (let time = 0; time < 20_000; time += 250) {
      expect(lean(time)).toBeLessThanOrEqual(0);
      expect(lean(time)).toBeGreaterThanOrEqual(-0.06);
    }
  });

  it('wobbles after a wrong note, about twice a second, and settles', () => {
    expect(wobble(-1)).toBe(0);
    expect(wobble(WOBBLE + 1)).toBe(0);
    const swings = Array.from({ length: 40 }, (_, n) => wobble(n * 50));
    expect(Math.max(...swings.map(Math.abs))).toBeGreaterThan(0.05);
    expect(Math.abs(wobble(WOBBLE - 50))).toBeLessThan(0.002);
    // Half a turn of its shudder takes longer than a sixth of a second: never a flicker.
    expect(Math.PI * 85).toBeGreaterThan(1000 / 6);
  });

  it('pops a treat on a little too big, then settles', () => {
    expect(popScale(1000, 900)).toBe(0);
    expect(popScale(1000, 1000 + POP / 2)).toBeGreaterThan(0.8);
    expect(popScale(1000, 1000 + POP * 0.7)).toBeGreaterThan(popScale(1000, 1000 + POP));
    expect(popScale(1000, 1000 + POP * 10)).toBeCloseTo(1);
  });
});
