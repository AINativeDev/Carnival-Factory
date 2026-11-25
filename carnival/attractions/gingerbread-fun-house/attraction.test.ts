import { describe, expect, it } from 'vitest';
import attraction, { CHASE, gumdropLit } from './attraction';
import {
  bare,
  decorate,
  lean,
  LEAN_FROM,
  MOST,
  onHouse,
  POP,
  popScale,
  TREATS,
} from './decorating';
import { MIRRORS, PATH, REACH, reflection, STROLL, strollAt } from './mirrors';

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

describe('decorating the house', () => {
  it('places a gumdrop, an icing swirl and a candy in turn, one a tap', () => {
    let house = bare();
    for (let tap = 0; tap < 4; tap++) house = decorate(house, 40, 50, tap * 1000, 1);
    expect(house.placed.map((placed) => placed.treat)).toEqual([...TREATS, 'gumdrop']);
    expect(house.placed.map((placed) => placed.tint)).toEqual([0, 1, 2, 3]);
    expect(house.count).toBe(4);
  });

  it('places nothing without a press', () => {
    expect(decorate(bare(), 40, 50, 0, 0)).toEqual(bare());
  });

  it('shows every tap that came between two frames, round the spot', () => {
    const house = decorate(bare(), 40, 50, 0, 3);
    expect(house.placed).toHaveLength(3);
    expect(new Set(house.placed.map((placed) => `${placed.x},${placed.y}`)).size).toBe(3);
    for (const placed of house.placed) {
      expect(Math.hypot(placed.x - 40, placed.y - 50)).toBeLessThan(4);
    }
  });

  it('keeps the newest treats once the house is full', () => {
    const house = decorate(bare(), 40, 50, 0, MOST + 5);
    expect(house.placed).toHaveLength(MOST);
    expect(house.count).toBe(MOST + 5);
    expect(house.placed[0]?.tint).toBe(5);
  });

  it('sticks a treat where it landed on the leaning house', () => {
    for (const time of [0, 1200, 4321]) {
      const spot = onHouse(30, 45, time);
      // Turning the spot back with the house's lean lands on the tap.
      const turn = lean(time);
      const dx = spot.x - LEAN_FROM.x;
      const dy = spot.y - LEAN_FROM.y;
      expect(LEAN_FROM.x + dx * Math.cos(turn) - dy * Math.sin(turn)).toBeCloseTo(30);
      expect(LEAN_FROM.y + dx * Math.sin(turn) + dy * Math.cos(turn)).toBeCloseTo(45);
    }
    expect(onHouse(LEAN_FROM.x, LEAN_FROM.y, 999)).toEqual(LEAN_FROM);
  });

  it('leans only a little, and always the same way', () => {
    for (let time = 0; time < 20_000; time += 250) {
      expect(lean(time)).toBeLessThanOrEqual(0);
      expect(lean(time)).toBeGreaterThanOrEqual(-0.06);
    }
  });

  it('pops a treat on a little too big, then settles', () => {
    expect(popScale(1000, 900)).toBe(0);
    expect(popScale(1000, 1000 + POP / 2)).toBeGreaterThan(0.8);
    expect(popScale(1000, 1000 + POP * 0.7)).toBeGreaterThan(popScale(1000, 1000 + POP));
    expect(popScale(1000, 1000 + POP * 10)).toBeCloseTo(1);
  });
});

describe('the fun-house mirrors', () => {
  it('strolls the elf across the snow and back, slowing to turn', () => {
    expect(strollAt(0).gx).toBeCloseTo(PATH.from);
    expect(strollAt(STROLL / 2).gx).toBeCloseTo(PATH.to);
    expect(strollAt(STROLL / 4).facing).toBe(1);
    expect(strollAt((STROLL * 3) / 4).facing).toBe(-1);
    expect(strollAt(STROLL + 1234).gx).toBeCloseTo(strollAt(1234).gx);
    expect(strollAt(STROLL + 1234).facing).toBe(strollAt(1234).facing);
    for (let time = 0; time < STROLL; time += 200) {
      const { gx } = strollAt(time);
      expect(gx).toBeGreaterThanOrEqual(PATH.from - 1e-9);
      expect(gx).toBeLessThanOrEqual(PATH.to + 1e-9);
    }
  });

  it('shows the elf only in a mirror it is passing, stretched its own way', () => {
    const [tall, wide] = MIRRORS;
    expect(reflection(tall, tall.gx + REACH, 0).shown).toBe(0);
    expect(reflection(tall, tall.gx, 0).shown).toBe(1);
    expect(reflection(tall, tall.gx + REACH / 2, 0).shown).toBeCloseTo(0.5);
    for (let time = 0; time < 5000; time += 250) {
      const inTall = reflection(tall, tall.gx, time);
      const inWide = reflection(wide, wide.gx, time);
      expect(inTall.tall).toBeGreaterThan(inTall.wide);
      expect(inWide.wide).toBeGreaterThan(inWide.tall);
    }
  });
});

describe('the drawing', () => {
  const texts: unknown[] = [];
  const gradient = { addColorStop: () => undefined };
  const noop = () => undefined;
  const ctx = {
    ...Object.fromEntries(
      [
        'save',
        'restore',
        'scale',
        'translate',
        'rotate',
        'fillRect',
        'beginPath',
        'closePath',
        'arc',
        'ellipse',
        'fill',
        'stroke',
        'moveTo',
        'lineTo',
        'clip',
      ].map((name) => [name, noop]),
    ),
    fillText: (text: unknown) => texts.push(text),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  } as unknown as CanvasRenderingContext2D;

  it('invites a tap until the first treat goes on, then plays on', () => {
    attraction.draw(ctx, 200, 0);
    expect(texts).toEqual(['Tap to decorate!']);
    // The elf passes each mirror as it strolls, and each treat pops on.
    for (let time = 0; time < STROLL; time += 100)
      attraction.draw(ctx, 200, time, { x: 80, y: 90, down: true, presses: time < 400 ? 1 : 0 });
    texts.length = 0;
    attraction.draw(ctx, 200, STROLL);
    expect(texts).toEqual([]);
  });
});
