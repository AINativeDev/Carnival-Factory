import { describe, expect, it } from 'vitest';
import { GUTTER, layoutMap, MIDWAY, SQUARE_SIZE, sidesFor, slotAt, type MapLayout } from './layout';

const step = SQUARE_SIZE + GUTTER;
/** Room for two squares on each side of the midway. */
const wide = 2 * GUTTER + 4 * step + MIDWAY;

const of = (layout: MapLayout, kind: string) =>
  layout.slots.filter((slot) => slot.kind === kind).map(({ index, x, y }) => ({ index, x, y }));

describe('sidesFor', () => {
  it('fits as many squares a side as the width allows, and always one', () => {
    expect(sidesFor(wide)).toBe(2);
    expect(sidesFor(wide - 1)).toBe(1);
    expect(sidesFor(0)).toBe(1);
  });
});

describe('layoutMap', () => {
  it('puts the attractions in pairs on either edge of the midway', () => {
    const layout = layoutMap(3, 0, wide);
    const midway = GUTTER + 2 * step;
    expect(layout.midway).toEqual({ x: midway, width: MIDWAY });
    expect(of(layout, 'attraction')).toEqual([
      { index: 0, x: midway - step, y: GUTTER },
      { index: 1, x: midway + MIDWAY + GUTTER, y: GUTTER },
      { index: 2, x: midway - step, y: GUTTER + step },
    ]);
    expect(layout.width).toBe(wide);
  });

  it('lines booths up beside the attractions, nearest the midway first', () => {
    const layout = layoutMap(3, 3, wide);
    const midway = GUTTER + 2 * step;
    expect(of(layout, 'booth')).toEqual([
      { index: 0, x: midway - 2 * step, y: GUTTER },
      { index: 1, x: midway + MIDWAY + GUTTER + step, y: GUTTER },
      // The square the odd attraction left free, beside the midway.
      { index: 2, x: midway + MIDWAY + GUTTER, y: GUTTER + step },
    ]);
  });

  it('carries booths on below the attractions', () => {
    const layout = layoutMap(2, 3, wide);
    expect(of(layout, 'booth').map(({ y }) => y)).toEqual([GUTTER, GUTTER, GUTTER + step]);
    expect(layout.height).toBe(GUTTER + 2 * step);
  });

  it('leaves the rest of the last row open, and always at least one spot', () => {
    expect(of(layoutMap(2, 1, wide), 'open')).toHaveLength(1);
    expect(of(layoutMap(2, 2, wide), 'open')).toHaveLength(4);
    expect(of(layoutMap(0, 0, wide), 'open')).toHaveLength(4);
  });

  it('never moves an attraction or an earlier booth when a booth is added', () => {
    for (const width of [0, wide, 3 * wide]) {
      for (let booths = 0; booths < 40; booths++) {
        const before = layoutMap(7, booths, width);
        const after = layoutMap(7, booths + 1, width);
        expect(of(after, 'attraction')).toEqual(of(before, 'attraction'));
        expect(of(after, 'booth').slice(0, booths)).toEqual(of(before, 'booth'));
      }
    }
  });

  it('never puts two squares in the same place', () => {
    const layout = layoutMap(8, 25, wide);
    const places = layout.slots.map(({ x, y }) => `${x},${y}`);
    expect(new Set(places).size).toBe(places.length);
    for (const { x, y } of layout.slots) {
      expect(x + SQUARE_SIZE).toBeLessThanOrEqual(layout.width - GUTTER);
      expect(y + SQUARE_SIZE).toBeLessThanOrEqual(layout.height - GUTTER);
    }
  });

  it('keeps clear of the midway', () => {
    const { slots, midway } = layoutMap(8, 25, wide);
    for (const { x } of slots) {
      expect(x + SQUARE_SIZE <= midway.x || x >= midway.x + midway.width).toBe(true);
    }
  });
});

describe('slotAt', () => {
  it('finds the square under a point, and nothing on the midway', () => {
    const layout = layoutMap(2, 1, wide);
    const [attraction] = layout.slots;
    expect(slotAt(layout, attraction.x + 10, attraction.y + 10)).toMatchObject({
      kind: 'attraction',
      index: 0,
    });
    expect(slotAt(layout, layout.midway.x + 10, GUTTER + 10)).toBeUndefined();
    expect(slotAt(layout, GUTTER / 2, GUTTER / 2)).toBeUndefined();
  });
});
