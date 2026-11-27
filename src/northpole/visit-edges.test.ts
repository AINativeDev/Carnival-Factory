import { describe, expect, it } from 'vitest';
import { inBox, nearestOpenSpot, placeTag, shareLink, tagText } from './visit';
import { key, type Spot, type World } from './world';

/** Visiting at its edges: a box's far corner, a description's first line, a tag's every way out. */
describe('a box, edges included', () => {
  const box = { x: 0, y: -200, w: 100, h: 220 };

  it('holds its far corner, and nothing a pixel past any side', () => {
    expect(inBox({ x: 100, y: 20 }, box)).toBe(true);
    for (const point of [
      { x: -1, y: 0 },
      { x: 101, y: 0 },
      { x: 50, y: -201 },
      { x: 50, y: 21 },
    ])
      expect(inBox(point, box), JSON.stringify(point)).toBe(false);
  });
});

describe("a tag's line", () => {
  const lineOf = (description: string) =>
    tagText({ kind: 'booth', id: 'elf' }, { name: 'Toys', description }).line;

  it('ends at the first sentence, however it ends, or the first line', () => {
    expect(lineOf('Ho ho! More.')).toBe('Ho ho!');
    expect(lineOf('Who? Me.')).toBe('Who?');
    expect(lineOf('One\r\nTwo')).toBe('One');
    expect(lineOf('One\nTwo')).toBe('One');
  });

  it('says only who a booth being built is for while its stage is unknown', () => {
    expect(tagText({ kind: 'site', id: 'amy' }, undefined).line).toBe('Booth for @amy: ');
  });

  it('runs on past a stop that no space follows', () => {
    expect(lineOf('v1.2 is out. Next')).toBe('v1.2 is out.');
    expect(lineOf('Wow!Bang')).toBe('Wow!Bang');
  });
});

describe("a tag's place", () => {
  const viewport = { w: 1000, h: 1000 };
  const size = { w: 100, h: 50 };
  const away = { x: 0, y: 0, w: 0, h: 0 };

  it('stays inside the far edges of the viewport', () => {
    expect(placeTag({ x: 990, y: 1100 }, size, away, viewport)).toEqual({ x: 892, y: 942 });
  });

  it("goes to the player's right, then their left, when it would cover them", () => {
    const player = { x: 440, y: 430, w: 40, h: 40 };
    expect(placeTag({ x: 500, y: 500 }, size, player, viewport)).toEqual({ x: 488, y: 442 });
    const atRight = { x: 880, y: 430, w: 120, h: 40 };
    expect(placeTag({ x: 930, y: 500 }, size, atRight, viewport)).toEqual({ x: 772, y: 442 });
  });

  it('goes above the player, then below them, when they fill the width', () => {
    const middle = { x: 0, y: 500, w: 1000, h: 40 };
    expect(placeTag({ x: 500, y: 560 }, size, middle, viewport)).toEqual({ x: 450, y: 442 });
    const top = { x: 0, y: 30, w: 1000, h: 40 };
    expect(placeTag({ x: 500, y: 60 }, size, top, viewport)).toEqual({ x: 450, y: 78 });
  });

  it('may touch the player, edge to edge, on every side, with no gap', () => {
    const player = { x: 440, y: 430, w: 40, h: 40 };
    expect(placeTag({ x: 500, y: 500 }, size, player, viewport, 0)).toEqual({ x: 480, y: 450 });
    const atRight = { x: 880, y: 430, w: 120, h: 40 };
    expect(placeTag({ x: 930, y: 500 }, size, atRight, viewport, 0)).toEqual({ x: 780, y: 450 });
    const middle = { x: 0, y: 500, w: 1000, h: 40 };
    expect(placeTag({ x: 500, y: 560 }, size, middle, viewport, 0)).toEqual({ x: 450, y: 450 });
    const top = { x: 0, y: 30, w: 1000, h: 40 };
    expect(placeTag({ x: 500, y: 60 }, size, top, viewport, 0)).toEqual({ x: 450, y: 70 });
  });
});

describe('a share link from deeper in the site', () => {
  it("leaves a folder that only starts like a pull request's preview alone", () => {
    const site = 'https://np.github.io/Carnival/';
    expect(shareLink('booth', 'elf', `${site}previews/pr-6/more/`)).toBe(
      `${site}previews/pr-6/more/share/booth-elf.html`,
    );
    expect(shareLink('booth', 'elf', `${site}previews/pr-x/`)).toBe(
      `${site}previews/pr-x/share/booth-elf.html`,
    );
    expect(shareLink('booth', 'elf', `${site}previews/pr-7/`)).toBe(`${site}share/booth-elf.html`);
    expect(shareLink('booth', 'elf', `${site}previews/pr-7/index.html#/booth/elf`)).toBe(
      `${site}share/booth-elf.html`,
    );
  });
});

describe('the spot next door, when the nearest is walled off', () => {
  const open = (x: number, y: number) =>
    ({ kind: 'open', x, y, w: 2, h: 2, number: 0, door: { x, y } }) as Spot;
  const world: World = {
    ground: new Map(),
    blocked: new Set([key(2, 0)]),
    things: [],
    spots: [open(2, 0), open(2, -4)],
    pond: { x: 0, y: 0, w: 0, h: 0 },
    paddock: { x: 0, y: 0, w: 0, h: 0 },
    strolls: [],
    extent: 6,
    start: { x: 0, y: 0 },
  };

  const at = (spots: Spot[], blocked: string[] = []) => ({
    ...world,
    spots,
    blocked: new Set(blocked),
  });

  it('is the nearest by its door, whichever way it lies and in whatever order they come', () => {
    const from = { x: 3, y: 2 };
    const near = open(4, 2);
    const far = open(0, 2);
    expect(nearestOpenSpot(at([far, near]), from)?.spot).toBe(near);
    const below = open(3, 3);
    const above = open(3, -1);
    expect(nearestOpenSpot(at([above, below]), from)?.spot).toBe(below);
  });

  it('is nowhere when the only door is underfoot but walled off', () => {
    expect(nearestOpenSpot(at([open(0, 0)], [key(0, 0)]), { x: 0, y: 0 })).toBeUndefined();
  });

  it('is the one the walk reaches, not another in line with its door', () => {
    const way = nearestOpenSpot(world, { x: 0, y: 0 });
    expect(way?.spot).toBe(world.spots[1]);
    expect(way?.path.at(-1)).toEqual({ x: 2, y: -4 });
    const inRow = at([open(2, 0), open(5, 0)], [key(2, 0)]);
    expect(nearestOpenSpot(inRow, { x: 0, y: 0 })?.spot).toBe(inRow.spots[1]);
  });
});
