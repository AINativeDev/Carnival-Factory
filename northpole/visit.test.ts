import { describe, expect, it } from 'vitest';
import pinned from './plots.json';
import { framing } from './camera';
import {
  inBox,
  nearestOpenPlot,
  placeTag,
  sharePath,
  shareText,
  tagText,
  targetAt,
  visitFraming,
} from './visit';
import { buildWorld, toScreen, walkAlong, type Plot } from './world';

const ATTRACTIONS = ['big-top', 'cocoa-stand', 'ferris-wheel', 'frozen-pond', 'sleigh-coaster'];
const world = buildWorld(ATTRACTIONS, ['elf-0', 'elf-1', 'jedi4ever'], pinned);
const plotOf = (id: string) => world.plots.find((plot) => plot.id === id)!;

describe('the camera on a visit', () => {
  it('glides in on the visited plot, nearer than it walks', () => {
    const plot = plotOf('jedi4ever');
    const visit = visitFraming(plot, 1200, 900);
    const walk = framing(world, 1200, 900, plot.door, 1, false);
    expect(visit.zoom).toBeGreaterThan(walk.zoom);
    const ground = toScreen({ x: plot.x + (plot.w - 1) / 2, y: plot.y + (plot.h - 1) / 2 });
    expect(visit.target.x).toBe(ground.x);
    // It looks a little above the ground, so what stands on the plot is in view.
    expect(visit.target.y).toBeLessThan(ground.y);
  });

  it('frames a bigger attraction further out than a stall', () => {
    expect(visitFraming(plotOf('ferris-wheel'), 1200, 900).zoom).toBeLessThanOrEqual(
      visitFraming(plotOf('jedi4ever'), 1200, 900).zoom,
    );
  });

  it('fits the plot in a phone too', () => {
    const plot = plotOf('ferris-wheel');
    const { zoom } = visitFraming(plot, 390, 700);
    expect(((plot.w + plot.h) * 32 * zoom) / 1).toBeLessThanOrEqual(390);
  });
});

describe('the plot next door', () => {
  it('walks to the open plot nearest the player, from their own tile', () => {
    const from = plotOf('jedi4ever').door;
    const way = nearestOpenPlot(world, from)!;
    expect(way.plot.kind).toBe('open');
    expect(way.path[0]).toEqual(from);
    expect(way.path.at(-1)).toEqual(way.plot.door);
    const distance = (plot: Plot) => Math.hypot(plot.door.x - from.x, plot.door.y - from.y);
    for (const plot of world.plots.filter((p) => p.kind === 'open'))
      expect(distance(way.plot)).toBeLessThanOrEqual(distance(plot));
  });

  it('gets the player there', () => {
    const way = nearestOpenPlot(world, world.start)!;
    const { position, path } = walkAlong(world.start, way.path, 1000);
    expect(path).toEqual([]);
    expect(position).toEqual(way.plot.door);
  });
});

describe('the share line', () => {
  const square = { kind: 'booth' as const, id: 'elf', name: "Santa's Toy Factory" };
  it("names the booth's builder, and ends with the link", () => {
    expect(shareText(square, 'https://x/share/booth-elf.html')).toBe(
      "@elf built Santa's Toy Factory at the North Pole Carnival. Come visit, and build your own: https://x/share/booth-elf.html",
    );
  });

  it('speaks for the owner when they share it as theirs', () => {
    expect(shareText(square, 'L', true)).toBe(
      "I built Santa's Toy Factory at the North Pole Carnival. Come visit, and build your own: L",
    );
  });

  it('invites to build a booth beside an attraction', () => {
    expect(shareText({ kind: 'attraction', id: 'ferris-wheel', name: 'Ferris Wheel' }, 'L')).toBe(
      'Ferris Wheel is at the North Pole Carnival. Come visit, and build a booth of your own: L',
    );
  });

  it("links to the square's share page", () => {
    expect(sharePath('booth', 'elf')).toBe('share/booth-elf.html');
    expect(sharePath('attraction', 'ferris-wheel')).toBe('share/attraction-ferris-wheel.html');
  });
});

describe('hovering', () => {
  const back = { id: 'back', box: { x: 0, y: -200, w: 100, h: 220 } };
  const front = { id: 'front', box: { x: 50, y: 0, w: 100, h: 60 } };

  it('finds the frontmost structure drawn under the point, its height included', () => {
    expect(targetAt([back, front], { x: 60, y: 10 })?.id).toBe('front');
    // High up the tall structure, far above its ground tile.
    expect(targetAt([back, front], { x: 20, y: -180 })?.id).toBe('back');
    expect(targetAt([back, front], { x: 300, y: 0 })).toBeUndefined();
    expect(inBox({ x: 0, y: -200 }, back.box)).toBe(true);
  });

  it("tags a square with its name, owner, its description's first line and a hint", () => {
    expect(
      tagText(
        { kind: 'booth', id: 'elf' },
        { name: 'Toys', description: 'Elves at work. Hammers too.' },
      ),
    ).toEqual({ name: 'Toys', owner: '@elf', line: 'Elves at work.', hint: 'E or click to visit' });
    expect(
      tagText({ kind: 'attraction', id: 'ferris-wheel' }, { name: 'Ferris', description: 'Round' })
        .owner,
    ).toBe('North Pole');
    expect(tagText({ kind: 'open' }, undefined).hint).toBe('E or click to claim this plot');
  });

  it('puts the tag above the structure, inside the viewport', () => {
    const player = { x: 900, y: 900, w: 20, h: 40 };
    expect(placeTag({ x: 400, y: 300 }, { w: 100, h: 50 }, player, { w: 1000, h: 1000 })).toEqual({
      x: 350,
      y: 242,
    });
    expect(placeTag({ x: 10, y: 10 }, { w: 100, h: 50 }, player, { w: 1000, h: 1000 })).toEqual({
      x: 8,
      y: 8,
    });
  });

  it('never covers the player', () => {
    const player = { x: 380, y: 230, w: 40, h: 80 };
    const size = { w: 100, h: 50 };
    const at = placeTag({ x: 400, y: 300 }, size, player, { w: 1000, h: 1000 });
    const overlaps =
      at.x < player.x + player.w &&
      at.x + size.w > player.x &&
      at.y < player.y + player.h &&
      at.y + size.h > player.y;
    expect(overlaps).toBe(false);
  });
});
