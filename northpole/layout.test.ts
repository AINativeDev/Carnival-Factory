import { describe, expect, it } from 'vitest';
import {
  distanceToBox,
  distanceToPath,
  footprint,
  hash,
  insideSlot,
  layoutMap,
  OPEN_SPOTS,
  placeScenery,
  sceneryExtent,
  SIGN_HEIGHT,
  SIGN_WIDTH,
  SQUARE_SIZE,
  scrollToward,
  slotAt,
  type Box,
  type MapLayout,
} from './layout';

const of = (layout: MapLayout, kind: string) =>
  layout.slots
    .filter((slot) => slot.kind === kind)
    .map(({ index, x, y, angle }) => ({ index, x, y, angle }));

const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The corners and edge midpoints of a box, to check it against a path. */
const edges = (box: Box) =>
  [0, 0.5, 1].flatMap((fx) =>
    [0, 0.25, 0.5, 0.75, 1].map((fy) => ({
      x: box.x + fx * box.width,
      y: box.y + fy * box.height,
    })),
  );

describe('hash', () => {
  it('gives the same number for the same values, between 0 and 1', () => {
    expect(hash(1, 2, 3)).toBe(hash(1, 2, 3));
    expect(hash(1, 2, 3)).not.toBe(hash(3, 2, 1));
    for (let i = 0; i < 100; i++) {
      expect(hash(i)).toBeGreaterThanOrEqual(0);
      expect(hash(i)).toBeLessThan(1);
    }
  });
});

describe('layoutMap', () => {
  it('makes the same town from the same squares', () => {
    expect(layoutMap(8, 20)).toEqual(layoutMap(8, 20));
  });

  it('gathers the attractions round the town square', () => {
    const layout = layoutMap(8, 5);
    for (const { x, y } of of(layout, 'attraction')) {
      const distance = Math.hypot(x - layout.plaza.x, y - layout.plaza.y);
      expect(distance).toBeGreaterThan(layout.plaza.radius);
      expect(distance).toBeLessThan(layout.plaza.radius + 200);
    }
  });

  it('turns squares a few degrees, not all the same way', () => {
    const angles = layoutMap(8, 20).slots.map(({ angle }) => angle);
    for (const angle of angles) expect(Math.abs(angle)).toBeLessThanOrEqual(0.1);
    expect(new Set(angles.map((angle) => Math.sign(angle))).size).toBeGreaterThan(1);
  });

  it('sets booths along the lanes, not on the town square', () => {
    const layout = layoutMap(8, 20);
    const lanes = layout.paths.filter((path) => path.kind === 'lane');
    expect(lanes.length).toBeGreaterThan(1);
    for (const slot of layout.slots.filter(({ kind }) => kind !== 'attraction')) {
      expect(Math.min(...lanes.map((lane) => distanceToPath(lane, slot)))).toBeLessThan(200);
      expect(Math.hypot(slot.x, slot.y)).toBeGreaterThan(layout.plaza.radius + 300);
    }
  });

  it('spaces squares unevenly along a lane, leaving gaps', () => {
    const ys = of(layoutMap(8, 60), 'booth')
      .filter((_, index) => index % 2 === 0)
      .map(({ y }) => y);
    const steps = new Set(ys.slice(1, 4).map((y, i) => Math.round(Math.abs(y - ys[i]))));
    expect(steps.size).toBeGreaterThan(1);
  });

  it('keeps a few open spots waiting at the end of the lanes', () => {
    for (const booths of [0, 1, 7, 40]) {
      const open = of(layoutMap(8, booths), 'open');
      expect(open.map(({ index }) => index)).toEqual([0, 1, 2].slice(0, OPEN_SPOTS));
    }
  });

  it('never moves an attraction or an earlier booth when a booth is added', () => {
    for (const attractions of [0, 3, 8, 20]) {
      for (let booths = 0; booths < 80; booths++) {
        const before = layoutMap(attractions, booths);
        const after = layoutMap(attractions, booths + 1);
        expect(of(after, 'attraction')).toEqual(of(before, 'attraction'));
        expect(of(after, 'booth').slice(0, booths)).toEqual(of(before, 'booth'));
        // The new booth takes the first spot that was open.
        expect(of(after, 'booth')[booths]).toEqual({ ...of(before, 'open')[0], index: booths });
      }
    }
  });

  it('opens new lanes as the town grows', () => {
    const lanes = (booths: number) =>
      layoutMap(8, booths).paths.filter(({ kind }) => kind === 'lane');
    expect(lanes(80).length).toBeGreaterThan(lanes(2).length);
    expect(lanes(80).slice(0, lanes(2).length)).toEqual(lanes(2));
  });

  it('never puts a square or its sign on another square, a path or the town square', () => {
    for (const [attractions, booths] of [
      [8, 0],
      [8, 30],
      [3, 90],
      [20, 60],
    ]) {
      const layout = layoutMap(attractions, booths);
      const boxes = layout.slots.map(footprint);
      boxes.forEach((box, i) => {
        for (const other of boxes.slice(i + 1)) expect(overlap(box, other)).toBe(false);
        expect(distanceToBox(box, layout.plaza)).toBeGreaterThan(layout.plaza.radius);
        for (const path of layout.paths) {
          for (const point of edges(box)) {
            expect(distanceToPath(path, point)).toBeGreaterThan(path.width / 2);
          }
        }
        expect(box.x).toBeGreaterThan(layout.bounds.x);
        expect(box.y).toBeGreaterThan(layout.bounds.y);
        expect(box.x + box.width).toBeLessThan(layout.bounds.x + layout.bounds.width);
        expect(box.y + box.height).toBeLessThan(layout.bounds.y + layout.bounds.height);
      });
    }
  });

  it('runs the stream under the midway at the bridge', () => {
    const layout = layoutMap(8, 10);
    const [midway] = layout.paths;
    const stream = layout.paths.find(({ kind }) => kind === 'stream')!;
    expect(midway.kind).toBe('midway');
    expect(distanceToPath(midway, layout.bridge)).toBeLessThan(1);
    expect(distanceToPath(stream, layout.bridge)).toBeLessThan(stream.width);
  });
});

describe('slotAt', () => {
  it('finds a turned square at its actual place and turn', () => {
    const layout = layoutMap(8, 10);
    const turned = layout.slots.find(({ angle }) => Math.abs(angle) > 0.05)!;
    expect(slotAt(layout, turned.x, turned.y)).toBe(turned);

    // A corner of the turned square, just inside it.
    const [cos, sin] = [Math.cos(turned.angle), Math.sin(turned.angle)];
    const near = SQUARE_SIZE / 2 - 2;
    const corner = { x: turned.x + near * cos - near * sin, y: turned.y + near * sin + near * cos };
    expect(slotAt(layout, corner.x, corner.y)).toBe(turned);

    // The same corner of an unturned square is outside the turned one.
    const far = { x: turned.x + near, y: turned.y - near };
    expect(insideSlot({ ...turned, angle: 0 }, far.x, far.y)).toBe(true);
    expect(insideSlot(turned, far.x, far.y)).toBe(false);
  });

  it('finds nothing on the town square or the midway', () => {
    const layout = layoutMap(8, 10);
    expect(slotAt(layout, 0, 0)).toBeUndefined();
    for (const point of layout.paths[0].points)
      expect(slotAt(layout, point.x, point.y)).toBeUndefined();
  });

  it('bounds the whole sign, turned about the centre of its square', () => {
    const slot = { kind: 'booth' as const, index: 0, x: 0, y: 0, angle: 0.09 };
    const box = footprint(slot);
    const [cos, sin] = [Math.cos(slot.angle), Math.sin(slot.angle)];
    for (const x of [-SIGN_WIDTH / 2, SIGN_WIDTH / 2]) {
      for (const y of [SQUARE_SIZE / 2, SQUARE_SIZE / 2 + SIGN_HEIGHT]) {
        expect(distanceToBox(box, { x: x * cos - y * sin, y: x * sin + y * cos })).toBe(0);
      }
    }
    expect(box.width).toBeGreaterThan(SIGN_WIDTH);
  });

  it('finds every square at its centre', () => {
    const layout = layoutMap(8, 30);
    for (const slot of layout.slots) expect(slotAt(layout, slot.x, slot.y)).toBe(slot);
  });
});

describe('placeScenery', () => {
  it('places the same scenery for the same town', () => {
    expect(placeScenery(layoutMap(8, 12))).toEqual(placeScenery(layoutMap(8, 12)));
  });

  it('fills the town with trees, drifts, fences and lamps', () => {
    const kinds = new Set(placeScenery(layoutMap(8, 12)).map(({ kind }) => kind));
    expect([...kinds].sort()).toEqual(['drift', 'fence', 'lamp', 'tree']);
  });

  it('keeps all the scenery paints off the squares, their signs, the paths and the town square', () => {
    for (const [attractions, booths] of [
      [8, 30],
      [3, 90],
    ]) {
      const layout = layoutMap(attractions, booths);
      const boxes = layout.slots.map(footprint);
      for (const item of placeScenery(layout)) {
        const { radius, ...at } = sceneryExtent(item);
        for (const box of boxes) expect(distanceToBox(box, at)).toBeGreaterThan(radius);
        expect(Math.hypot(at.x - layout.plaza.x, at.y - layout.plaza.y)).toBeGreaterThan(
          layout.plaza.radius + radius,
        );
        for (const path of layout.paths)
          expect(distanceToPath(path, at)).toBeGreaterThan(path.width / 2 + radius);
      }
    }
  });

  it('holds everything a tree and a lamp paint in their extents', () => {
    const tree = sceneryExtent({ kind: 'tree', x: 0, y: 0, seed: 1 });
    // The tallest tree's top, and its lowest branch tips, at 1.3 times its size.
    for (const [x, y] of [
      [0, -35],
      [22, 8],
      [-22, 8],
      [3, 18],
    ]) {
      expect(Math.hypot(1.3 * x - tree.x, 1.3 * y - tree.y)).toBeLessThanOrEqual(tree.radius);
    }
    const lamp = sceneryExtent({ kind: 'lamp', x: 0, y: 0, seed: 0 });
    for (const [x, y] of [
      [0, -26],
      [4, -22],
      [4, 3],
      [-4, 3],
    ]) {
      expect(Math.hypot(x - lamp.x, y - lamp.y)).toBeLessThanOrEqual(lamp.radius);
    }
  });

  it('still lights both sides of the midway', () => {
    const layout = layoutMap(8, 12);
    const lamps = placeScenery(layout).filter(({ kind }) => kind === 'lamp');
    const midway = layout.paths[0];
    const near = lamps.filter((lamp) => distanceToPath(midway, lamp) < midway.width / 2 + 40);
    const below = (lamp: { x: number; y: number }) => {
      const at = midway.points.reduce((a, b) =>
        Math.abs(b.x - lamp.x) < Math.abs(a.x - lamp.x) ? b : a,
      );
      return lamp.y > at.y;
    };
    expect(near.some((lamp) => !below(lamp))).toBe(true);
    expect(near.some(below)).toBe(true);
  });
});

describe('scrollToward', () => {
  const bounds = { x: -1000, y: -500, width: 2000, height: 1000 };

  it('centres a point in the frame when there is room', () => {
    expect(scrollToward(bounds, { x: 0, y: 0 }, 400, 300)).toEqual({ left: 800, top: 350 });
    expect(scrollToward(bounds, { x: 300, y: -100 }, 400, 300)).toEqual({ left: 1100, top: 250 });
  });

  it('stops at the edges of the town', () => {
    expect(scrollToward(bounds, { x: -990, y: -490 }, 400, 300)).toEqual({ left: 0, top: 0 });
    expect(scrollToward(bounds, { x: 990, y: 490 }, 400, 300)).toEqual({ left: 1600, top: 700 });
  });

  it('never scrolls a frame wider than the town', () => {
    expect(scrollToward(bounds, { x: 500, y: 0 }, 2400, 300)).toEqual({ left: 0, top: 350 });
  });

  it('brings every square into view on a narrow phone screen and a wide one', () => {
    const layout = layoutMap(3, 12);
    for (const [width, height] of [
      [360, 560],
      [1200, 760],
    ]) {
      for (const slot of layout.slots) {
        const { left, top } = scrollToward(layout.bounds, slot, width, height);
        const [x, y] = [slot.x - layout.bounds.x - left, slot.y - layout.bounds.y - top];
        expect(x).toBeGreaterThanOrEqual(SQUARE_SIZE / 2);
        expect(x).toBeLessThanOrEqual(width - SQUARE_SIZE / 2);
        expect(y).toBeGreaterThanOrEqual(SQUARE_SIZE / 2);
        expect(y).toBeLessThanOrEqual(height - SQUARE_SIZE / 2);
      }
    }
  });
});
