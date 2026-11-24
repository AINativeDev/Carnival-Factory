import { describe, expect, it } from 'vitest';
import pinned from './plots.json';
import {
  attractionPlot,
  boothPlot,
  buildWorld,
  canStand,
  findPath,
  findPathToFirst,
  key,
  moveBy,
  nearestStand,
  OPEN_PLOTS,
  plotAtDoor,
  plotNumbers,
  reachable,
  screenDirection,
  strollAt,
  toScreen,
  toTile,
  walkable,
  walkAlong,
  type Box,
  type World,
} from './world';

const ATTRACTIONS = ['big-top', 'cocoa-stand', 'ferris-wheel', 'frozen-pond', 'sleigh-coaster'];
const booths = (count: number) => Array.from({ length: count }, (_, n) => `elf-${n}`);

const placeOf = (world: World, id: string) => {
  const plot = world.plots.find((p) => p.id === id)!;
  return { x: plot.x, y: plot.y, w: plot.w, h: plot.h, door: plot.door };
};

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

describe('plotNumbers', () => {
  it('keeps pinned squares on their numbers and gives the rest the lowest free ones', () => {
    const numbers = plotNumbers(['amy', 'bob', 'cat'], { bob: 0 });
    expect([...numbers]).toEqual([
      ['bob', 0],
      ['amy', 1],
      ['cat', 2],
    ]);
  });

  it('ignores a pin that is taken or not a plot number', () => {
    const numbers = plotNumbers(['amy', 'bob', 'cat'], { amy: 1, bob: 1, cat: -2 });
    expect(numbers.get('amy')).toBe(1);
    expect(new Set(numbers.values()).size).toBe(3);
  });

  it('pins every square that is on the map today', () => {
    expect(Object.keys(pinned.booths)).toContain('jedi4ever');
    expect(Object.keys(pinned.attractions).length).toBeGreaterThanOrEqual(8);
  });
});

describe('buildWorld', () => {
  it('builds the same world from the same squares', () => {
    const a = buildWorld(ATTRACTIONS, booths(9));
    const b = buildWorld(ATTRACTIONS, booths(9));
    expect(b.plots).toEqual(a.plots);
    expect(b.things).toEqual(a.things);
    expect([...b.blocked].sort()).toEqual([...a.blocked].sort());
  });

  it('never moves an attraction or a pinned booth when a booth is added', () => {
    const pins = { attractions: {}, booths: { 'elf-1': 0, 'elf-0': 1, 'elf-2': 2 } };
    const before = buildWorld(ATTRACTIONS, booths(3), pins);
    // A new booth whose folder sorts before all the others.
    const after = buildWorld(ATTRACTIONS, ['aaron', ...booths(3)], pins);
    for (const id of [...ATTRACTIONS, ...booths(3)]) {
      expect(placeOf(after, id)).toEqual(placeOf(before, id));
    }
    const firstOpen = before.plots.find((p) => p.kind === 'open')!;
    expect(after.plots.find((p) => p.id === 'aaron')!.number).toBe(firstOpen.number);
  });

  it('gives a new booth the next free plot, the first open one', () => {
    const before = buildWorld(ATTRACTIONS, booths(4));
    const firstOpen = before.plots.find((p) => p.kind === 'open')!;
    const after = buildWorld(ATTRACTIONS, booths(5));
    const added = after.plots.find((p) => p.id === 'elf-4')!;
    expect({ x: added.x, y: added.y }).toEqual({ x: firstOpen.x, y: firstOpen.y });
  });

  it('keeps every plot, building and path apart', () => {
    const world = buildWorld(ATTRACTIONS.concat(booths(11)), booths(70));
    const covered = new Map<string, string>();
    for (const box of [...world.plots, ...world.things.filter((t) => t.blocks)]) {
      const name = JSON.stringify(box);
      for (let x = box.x; x < box.x + box.w; x++)
        for (let y = box.y; y < box.y + box.h; y++) {
          expect(covered.get(key(x, y)), name).toBeUndefined();
          covered.set(key(x, y), name);
        }
    }
    for (const plot of world.plots) {
      const door = world.ground.get(key(plot.door.x, plot.door.y));
      expect(door === 'path' || door === 'plaza').toBe(true);
    }
  });

  it('always has open plots waiting, more as booths are claimed', () => {
    for (const count of [0, 1, 6, 25]) {
      const world = buildWorld(ATTRACTIONS, booths(count));
      expect(world.plots.filter((p) => p.kind === 'open')).toHaveLength(OPEN_PLOTS);
      expect(world.plots.filter((p) => p.kind === 'booth')).toHaveLength(count);
    }
  });

  it('puts construction sites on their held plots, with open plots on top of them', () => {
    const pending = [
      { login: 'amy', issue: 7, plot: 4, stage: 'building' as const },
      { login: 'bob', issue: 9, plot: 5, stage: 'checks' as const },
    ];
    const world = buildWorld(ATTRACTIONS, booths(4), undefined, { pending });
    const sites = world.plots.filter((p) => p.kind === 'site');
    expect(sites.map((p) => [p.id, p.number])).toEqual([
      ['amy', 4],
      ['bob', 5],
    ]);
    expect(world.plots.filter((p) => p.kind === 'open').map((p) => p.number)).toEqual([6, 7, 8]);
    // The site stands where the booth will, and nothing else moves.
    const landed = buildWorld(ATTRACTIONS, [...booths(4), 'amy'], undefined, {
      files: { amy: { plot: 4, issue: 7 } },
      pending: pending.slice(1),
    });
    expect(placeOf(landed, 'amy')).toEqual(placeOf(world, 'amy'));
    for (const id of [...ATTRACTIONS, ...booths(4), 'bob'])
      expect(placeOf(landed, id)).toEqual(placeOf(world, id));
  });

  it('shows a change to an existing booth on that booth, not on a new plot', () => {
    const pending = [{ login: 'elf-1', issue: 7, plot: 1, stage: 'almost' as const }];
    const world = buildWorld(ATTRACTIONS, booths(3), undefined, { pending });
    expect(world.plots.filter((p) => p.kind === 'site')).toEqual([]);
    expect(world.plots.filter((p) => p.id === 'elf-1')).toHaveLength(1);
  });

  it('keeps the island small when a plot.json or a site claims a far plot', () => {
    const small = buildWorld(ATTRACTIONS, booths(4));
    const world = buildWorld(ATTRACTIONS, [...booths(4), 'amy'], undefined, {
      files: { amy: { plot: 9999 } },
      pending: [{ login: 'bob', issue: 9, plot: 9998, stage: 'building' }],
    });
    expect(world.extent).toBe(small.extent);
  });

  it('finds the nearest place to stand when a site went up where the player was', () => {
    const world = buildWorld(ATTRACTIONS, booths(4), undefined, {
      pending: [{ login: 'amy', issue: 7, plot: 4, stage: 'building' }],
    });
    const site = world.plots.find((p) => p.kind === 'site')!;
    const inside = { x: site.x + site.w / 2, y: site.y + site.h / 2 };
    expect(canStand(world, inside)).toBe(false);
    const stand = nearestStand(world, inside);
    expect(canStand(world, stand)).toBe(true);
    expect(Math.hypot(stand.x - inside.x, stand.y - inside.y)).toBeLessThan(site.w + site.h);
    expect(nearestStand(world, world.start)).toBe(world.start);
  });

  it('keeps growing for a big event: open plots, no overlaps, every plot reachable', () => {
    for (const count of [100, 500]) {
      const world = buildWorld(ATTRACTIONS, booths(count));
      expect(world.plots.filter((p) => p.kind === 'open')).toHaveLength(OPEN_PLOTS);
      const overlapping = world.plots.some((a, i) =>
        world.plots.some(
          (b, j) =>
            i < j && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h,
        ),
      );
      expect(overlapping).toBe(false);
      const e = world.extent;
      expect(
        world.plots.every((p) => p.x >= -e && p.y >= -e && p.x + p.w <= e && p.y + p.h <= e),
      ).toBe(true);
      const reach = reachable(world, world.start);
      expect(world.plots.filter((p) => !reach.has(key(p.door.x, p.door.y)))).toEqual([]);
    }
  });

  it('grows new lanes as booths fill the old ones', () => {
    const small = buildWorld(ATTRACTIONS, booths(2));
    const big = buildWorld(ATTRACTIONS, booths(40));
    expect(big.extent).toBeGreaterThan(small.extent);
    expect(boothPlot(40)).not.toEqual(boothPlot(4));
  });

  it('keeps scenery off attractions pinned past where their count would reach', () => {
    // An attraction pinned to 0 has gone, so eight are left on plots 1 to 8,
    // and one alone is pinned far out.
    const eight = ATTRACTIONS.concat(['a', 'b', 'c']);
    const gap = Object.fromEntries(eight.map((id, n) => [id, n + 1]));
    for (const world of [
      buildWorld(eight, booths(1), { attractions: gap, booths: {} }),
      buildWorld(['far'], booths(1), { attractions: { far: 48 }, booths: {} }),
    ]) {
      const things = world.things.filter((t) => t.blocks);
      for (const plot of world.plots.filter((p) => p.kind === 'attraction')) {
        for (let x = plot.x; x < plot.x + plot.w; x++)
          for (let y = plot.y; y < plot.y + plot.h; y++) {
            expect(world.ground.get(key(x, y)) ?? 'snow', plot.id).not.toMatch(/ice|water/);
            for (const thing of things)
              expect(
                x >= thing.x && x < thing.x + thing.w && y >= thing.y && y < thing.y + thing.h,
              ).toBe(false);
          }
        expect(findPath(world, world.start, plot.door), plot.id).toBeDefined();
      }
    }
  });

  it('puts attractions round the town square, closer in than any booth', () => {
    const near = (box: Box) => Math.max(Math.abs(box.x), Math.abs(box.y));
    for (let n = 0; n < 8; n++) expect(near(attractionPlot(n))).toBeLessThan(near(boothPlot(0)));
  });

  it('has the pond, a stream with a bridge, cabins, a stable, the ferris wheel, tents, the arch and a forest', () => {
    const world = buildWorld(ATTRACTIONS, booths(3));
    const grounds = new Set(world.ground.values());
    for (const kind of ['ice', 'water', 'bridge', 'path', 'plaza'] as const)
      expect(grounds).toContain(kind);
    const kinds = new Set(world.things.map((t) => t.kind));
    for (const kind of [
      'tree',
      'cabin',
      'lamp',
      'fence',
      'stable',
      'sleigh',
      'town-tree',
      'wheel',
      'tent',
      'bench',
      'cart',
      'arch',
      'banner',
      'bunting',
    ] as const)
      expect(kinds).toContain(kind);
  });
});

describe('walking', () => {
  const world = buildWorld(ATTRACTIONS, booths(10));

  it('starts on open ground inside the entrance arch', () => {
    expect(canStand(world, world.start)).toBe(true);
  });

  it('blocks buildings, trees, stalls and water, but not paths or snow', () => {
    for (const thing of world.things.filter((t) => t.blocks))
      expect(walkable(world, thing.x, thing.y), JSON.stringify(thing)).toBe(false);
    for (const plot of world.plots.filter((p) => p.kind !== 'open'))
      expect(walkable(world, plot.x, plot.y)).toBe(false);
    for (const [at, ground] of world.ground)
      if (ground === 'water' || ground === 'ice') expect(world.blocked.has(at)).toBe(true);
    expect(walkable(world, world.extent + 1, 0)).toBe(false);
  });

  it('finds a way from the town square to every plot', () => {
    for (const plot of world.plots) {
      const path = findPath(world, world.start, plot.door);
      expect(path, `${plot.kind} ${plot.id ?? plot.number}`).toBeDefined();
      for (const step of path!) expect(walkable(world, step.x, step.y)).toBe(true);
      expect(path!.at(-1)).toEqual(plot.door);
    }
  });

  it('takes the shortest way and no way at all to a blocked tile', () => {
    expect(findPath(world, { x: 0, y: 2 }, { x: 2, y: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
    expect(findPath(world, world.start, { x: 0, y: 0 })).toBeUndefined();
  });

  it('walks to the first goal it can reach, after any it cannot', () => {
    const { paddock } = world;
    const fenced = { x: paddock.x + 1, y: paddock.y + 1 };
    expect(walkable(world, fenced.x, fenced.y)).toBe(true);
    expect(reachable(world, world.start).has(key(fenced.x, fenced.y))).toBe(false);
    const goals = [fenced, { x: 0, y: 0 }, { x: 0, y: 2 }, { x: 1, y: 2 }];
    expect(findPathToFirst(world, world.start, goals)).toEqual(
      findPath(world, world.start, { x: 0, y: 2 }),
    );
    expect(findPathToFirst(world, world.start, [fenced, { x: 0, y: 0 }])).toBeUndefined();
  });

  it('keeps clear of the town tree joining a path from part-way across a tile', () => {
    const at = { x: -0.71, y: 0.6 };
    expect(canStand(world, at)).toBe(true);
    // The map starts a click's walk at the middle of the player's own tile.
    let walk = {
      position: at,
      path: [{ x: -1, y: 1 }, ...findPath(world, { x: -1, y: 1 }, { x: 0, y: 1 })!],
    };
    while (walk.path.length) {
      walk = walkAlong(walk.position, walk.path, 0.02);
      expect(canStand(world, walk.position), JSON.stringify(walk.position)).toBe(true);
    }
  });

  it('stops at what is blocked and slides along it', () => {
    // The town tree is at (0, 0): walking straight into it goes nowhere.
    const below = { x: 0, y: 1 };
    expect(moveBy(world, below, 0, -0.5)).toEqual(below);
    // Walking at it slantwise slides past.
    expect(moveBy(world, below, 0.3, -0.5)).toEqual({ x: 0.3, y: 1 });
    expect(moveBy(world, { x: 0, y: 2 }, 0.5, 0)).toEqual({ x: 0.5, y: 2 });
  });

  it('turns the arrow keys into directions on screen', () => {
    const right = screenDirection(1, 0);
    const screen = toScreen(right);
    expect(screen.y).toBeCloseTo(0);
    expect(screen.x).toBeGreaterThan(0);
    const up = toScreen(screenDirection(0, -1));
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeLessThan(0);
    expect(screenDirection(1, 0).x ** 2 + screenDirection(1, 0).y ** 2).toBeCloseTo(1);
    expect(screenDirection(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('walks along a path at the pace it is given', () => {
    const path = [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    expect(walkAlong({ x: 0, y: 0 }, path, 0.5)).toEqual({ position: { x: 0.5, y: 0 }, path });
    expect(walkAlong({ x: 0, y: 0 }, path, 1.5)).toEqual({
      position: { x: 1.5, y: 0 },
      path: [{ x: 2, y: 0 }],
    });
    expect(walkAlong({ x: 0, y: 0 }, path, 5)).toEqual({ position: { x: 2, y: 0 }, path: [] });
  });

  it('knows which plot you are standing at', () => {
    const booth = world.plots.find((p) => p.id === 'elf-3')!;
    expect(plotAtDoor(world, booth.door)).toBe(booth);
    expect(plotAtDoor(world, world.start)).toBeUndefined();
  });

  it('keeps strollers on walkable ground', () => {
    for (const stroll of world.strolls)
      for (const time of [0, 5000, 60000]) {
        const at = strollAt(stroll, time);
        expect(walkable(world, Math.round(at.x), Math.round(at.y))).toBe(true);
      }
  });
});
