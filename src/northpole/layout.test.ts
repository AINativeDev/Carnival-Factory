import { describe, expect, it } from 'vitest';
import { GUTTER, layoutMap, PLOT_SIZE, slotAt } from './layout';

const step = PLOT_SIZE + GUTTER;

describe('layoutMap', () => {
  it('lays plots out in a near-square grid', () => {
    const layout = layoutMap(5, 2000);
    expect(layout.slots.map(({ x, y }) => [x, y])).toEqual([
      [GUTTER, GUTTER],
      [GUTTER + step, GUTTER],
      [GUTTER + 2 * step, GUTTER],
      [GUTTER, GUTTER + step],
      [GUTTER + step, GUTTER + step],
    ]);
    expect(layout.width).toBe(GUTTER + 3 * step);
    expect(layout.height).toBe(GUTTER + 2 * step);
  });

  it('wraps to fit a narrow screen', () => {
    const layout = layoutMap(4, GUTTER + step);
    expect(layout.slots.every((slot) => slot.x === GUTTER)).toBe(true);
    expect(layout.height).toBe(GUTTER + 4 * step);
  });

  it('still has room for one plot when the map is empty', () => {
    const layout = layoutMap(0, 1000);
    expect(layout.slots).toEqual([]);
    expect(layout.width).toBe(GUTTER + step);
  });
});

describe('slotAt', () => {
  it('finds the plot under a point, and nothing on the path', () => {
    const layout = layoutMap(2, 2000);
    expect(slotAt(layout, GUTTER + step + 10, GUTTER + 10)?.index).toBe(1);
    expect(slotAt(layout, GUTTER / 2, GUTTER / 2)).toBeUndefined();
  });
});
