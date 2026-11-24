import { describe, expect, it } from 'vitest';
import { STALL_SHAPES_DRAWN, stallLook, stallOutline, stallReach } from './render';
import { STALL_SHAPES } from './square';
import { theme } from './theme';

describe('stallOutline', () => {
  it('keeps every shape on its own plot', () => {
    for (const shape of STALL_SHAPES) {
      for (const { along, depth } of stallOutline(shape)) {
        expect(along).toBeGreaterThanOrEqual(0);
        expect(along).toBeLessThanOrEqual(1);
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
      }
    }
  });

  it('fills the plot for the stall, the shed and the cabin', () => {
    for (const shape of ['stall', 'shed', 'cabin'] as const) {
      expect(stallOutline(shape)).toEqual([
        { along: 0, depth: 0 },
        { along: 1, depth: 0 },
        { along: 1, depth: 1 },
        { along: 0, depth: 1 },
      ]);
    }
  });

  it('makes the tent round and the kiosk a hexagon flat to the front', () => {
    const tent = stallOutline('tent');
    expect(tent.length).toBeGreaterThanOrEqual(12);
    const radii = tent.map((p) => Math.hypot(p.along - 0.5, p.depth - 0.5));
    for (const r of radii) expect(r).toBeCloseTo(radii[0]);
    const kiosk = stallOutline('kiosk');
    expect(kiosk).toHaveLength(6);
    const front = Math.min(...kiosk.map((p) => p.depth));
    expect(kiosk.filter((p) => Math.abs(p.depth - front) < 1e-9)).toHaveLength(2);
  });
});

describe('stallLook', () => {
  it("draws today's market stall without an option", () => {
    expect(stallLook(undefined)).toEqual({
      shape: 'stall',
      roof: theme.colors.berry,
      trim: theme.colors.snow,
    });
  });

  it("uses the booth's shape and theme colours", () => {
    expect(stallLook({ shape: 'shed', roof: 'gold' })).toEqual({
      shape: 'shed',
      roof: theme.colors.gold,
      trim: theme.colors.cream,
    });
    expect(stallLook({ shape: 'tent', roof: 'pine', trim: 'gold' })).toEqual({
      shape: 'tent',
      roof: theme.colors.pine,
      trim: theme.colors.gold,
    });
  });
});

describe('stallReach', () => {
  it('covers each shape, and keeps the shed the lowest', () => {
    for (const shape of STALL_SHAPES) {
      const { wall, roof } = STALL_SHAPES_DRAWN[shape];
      expect(stallReach(shape)).toBeGreaterThanOrEqual(wall + roof);
      expect(stallReach(shape)).toBeLessThan(200);
    }
    const others = STALL_SHAPES.filter((shape) => shape !== 'shed').map(stallReach);
    expect(stallReach('shed')).toBeLessThan(Math.min(...others));
  });
});
