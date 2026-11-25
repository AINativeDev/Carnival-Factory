import { describe, expect, it } from 'vitest';
import pinned from './plots.json';
import {
  inBox,
  nearestOpenPlot,
  placeTag,
  shareLink,
  sharePath,
  shareText,
  tagText,
  targetAt,
  nearYou,
} from './visit';
import { walkAlong } from './walking';
import { type Plot } from './world';
import { buildWorld } from './world-build';

const ATTRACTIONS = ['big-top', 'cocoa-stand', 'ferris-wheel', 'frozen-pond', 'sleigh-coaster'];
const world = buildWorld(ATTRACTIONS, ['elf-0', 'elf-1', 'jedi4ever'], pinned);
const plotOf = (id: string) => world.plots.find((plot) => plot.id === id)!;

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
      "@elf built Santa's Toy Factory at Carnival Factory. Come visit, and get a booth too: https://x/share/booth-elf.html",
    );
  });

  it('speaks for the owner when they share it as theirs', () => {
    expect(shareText(square, 'L', true)).toBe(
      "I built Santa's Toy Factory at Carnival Factory. Come visit, and get a booth too: L",
    );
  });

  it('invites to build a booth beside an attraction', () => {
    expect(shareText({ kind: 'attraction', id: 'ferris-wheel', name: 'Ferris Wheel' }, 'L')).toBe(
      'Ferris Wheel is at Carnival Factory. Come visit, and get a booth too: L',
    );
  });

  it("names a participant's level's builder, and a North Pole level as the North Pole's", () => {
    expect(shareText({ kind: 'level', id: 'bo', name: 'Ice Maze' }, 'L')).toBe(
      '@bo built Ice Maze, a level, at Carnival Factory. Come visit, and get a booth too: L',
    );
    expect(shareText({ kind: 'level', id: 'the-factory', name: 'The Factory' }, 'L')).toBe(
      'The Factory, a level, is at Carnival Factory. Come visit, and get a booth too: L',
    );
  });

  it("links to the square's share page", () => {
    expect(sharePath('booth', 'elf')).toBe('share/booth-elf.html');
    expect(sharePath('attraction', 'ferris-wheel')).toBe('share/attraction-ferris-wheel.html');
  });

  it("links a pull request's preview to the live site's share page, which outlives it", () => {
    const site = 'https://np.github.io/Carnival/';
    expect(shareLink('booth', 'elf', `${site}#/booth/elf`)).toBe(`${site}share/booth-elf.html`);
    expect(shareLink('booth', 'elf', `${site}previews/pr-66/#/booth/elf`)).toBe(
      `${site}share/booth-elf.html`,
    );
    expect(shareLink('booth', 'elf', 'http://localhost:4173/')).toBe(
      'http://localhost:4173/share/booth-elf.html',
    );
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
    ).toBe('');
    expect(tagText({ kind: 'open' }, undefined)).toEqual({
      name: 'Free spot',
      owner: '',
      line: 'Ask for a booth, and an agent builds it here.',
      hint: 'E or click to build your booth here',
    });
  });

  it('says who a booth being built is for and its stage, and nothing from the request', () => {
    expect(tagText({ kind: 'site', id: 'amy' }, undefined, 'Checks running')).toEqual({
      name: 'Being built',
      owner: '',
      line: 'Booth for @amy: Checks running',
      hint: 'E or click to see the request',
    });
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

describe('Near you', () => {
  it('lists the squares whose doors are closest, nearest first', () => {
    const squares = [0, 5, 2, 9, 1, 7, 3].map((x) => ({ id: `${x}`, door: { x, y: 0 } }));
    const near = nearYou(squares, { x: 0, y: 0 });
    expect(near.map((square) => square.id)).toEqual(['0', '1', '2', '3', '5']);
  });

  it('follows the player as they walk', () => {
    const squares = [0, 10, 20].map((x) => ({ id: `${x}`, door: { x, y: 0 } }));
    expect(nearYou(squares, { x: 19, y: 0 }, 1)[0].id).toBe('20');
  });
});
