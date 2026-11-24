import { describe, expect, it } from 'vitest';
import { GUTTER, layoutMap, MIDWAY, PLOT_SIZE, sidesFor, slotAt, type MapLayout } from './layout';

const step = PLOT_SIZE + GUTTER;
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

  it('lines plots up beside the attractions, nearest the midway first', () => {
    const layout = layoutMap(3, 3, wide);
    const midway = GUTTER + 2 * step;
    expect(of(layout, 'plot')).toEqual([
      { index: 0, x: midway - 2 * step, y: GUTTER },
      { index: 1, x: midway + MIDWAY + GUTTER + step, y: GUTTER },
      // The square the odd attraction left free, beside the midway.
      { index: 2, x: midway + MIDWAY + GUTTER, y: GUTTER + step },
    ]);
  });

  it('carries plots on below the attractions', () => {
    const layout = layoutMap(2, 3, wide);
    expect(of(layout, 'plot').map(({ y }) => y)).toEqual([GUTTER, GUTTER, GUTTER + step]);
    expect(layout.height).toBe(GUTTER + 2 * step);
  });

  it('leaves the rest of the last row open, and always at least one spot', () => {
    expect(of(layoutMap(2, 1, wide), 'open')).toHaveLength(1);
    expect(of(layoutMap(2, 2, wide), 'open')).toHaveLength(4);
    expect(of(layoutMap(0, 0, wide), 'open')).toHaveLength(4);
  });

  it('never moves an attraction or an earlier plot when a plot is added', () => {
    for (const width of [0, wide, 3 * wide]) {
      for (let plots = 0; plots < 40; plots++) {
        const before = layoutMap(7, plots, width);
        const after = layoutMap(7, plots + 1, width);
        expect(of(after, 'attraction')).toEqual(of(before, 'attraction'));
        expect(of(after, 'plot').slice(0, plots)).toEqual(of(before, 'plot'));
      }
    }
  });

  it('never puts two squares in the same place', () => {
    const layout = layoutMap(8, 25, wide);
    const places = layout.slots.map(({ x, y }) => `${x},${y}`);
    expect(new Set(places).size).toBe(places.length);
    for (const { x, y } of layout.slots) {
      expect(x + PLOT_SIZE).toBeLessThanOrEqual(layout.width - GUTTER);
      expect(y + PLOT_SIZE).toBeLessThanOrEqual(layout.height - GUTTER);
    }
  });

  it('keeps clear of the midway', () => {
    const { slots, midway } = layoutMap(8, 25, wide);
    for (const { x } of slots) {
      expect(x + PLOT_SIZE <= midway.x || x >= midway.x + midway.width).toBe(true);
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
