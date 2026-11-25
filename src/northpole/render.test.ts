import { describe, expect, it } from 'vitest';
import { decorationsFor } from './advent';
import { adventCrown, ADVENT_SIGN } from './advent-decorations';
import { SHAPE_PLANS } from './stall-catalogue';
import { PAVILION, stallLook, stallOutline, stallReach } from './stall-plan';
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
  it('covers each shape, tall ones under an attraction, and keeps the shed lower than the classic ones', () => {
    for (const shape of STALL_SHAPES) {
      const { wall, roof } = SHAPE_PLANS[shape];
      expect(stallReach(shape)).toBeGreaterThanOrEqual(wall + roof);
      expect(stallReach(shape)).toBeLessThan(PAVILION.wall + PAVILION.roof);
    }
    const classic = (['stall', 'tent', 'cabin', 'kiosk'] as const).map(stallReach);
    expect(stallReach('shed')).toBeLessThan(Math.min(...classic));
  });
});

describe('adventCrown', () => {
  it('adds nothing over the stall until the star, then the sign under it', () => {
    expect(adventCrown(decorationsFor(0))).toBe(0);
    expect(adventCrown(decorationsFor(11))).toBe(0);
    expect(adventCrown(decorationsFor(12))).toBe(22);
    expect(adventCrown(decorationsFor(24))).toBe(22 + ADVENT_SIGN.h + 6);
  });
});
