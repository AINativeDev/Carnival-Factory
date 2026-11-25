import { describe, expect, it } from 'vitest';
import pinned from './plots.json';
import { nearestOpenPlot, nearYou, placeTag, platformTag, tagText } from './visit';
import { key } from './world';
import { buildWorld } from './world-build';

describe('the plot next door, from right beside one', () => {
  const small = buildWorld(['big-top'], ['elf-0'], pinned);
  const open = small.plots.filter((plot) => plot.kind === 'open');

  it('is the open plot whose door the player stands at, with nowhere to walk', () => {
    const first = open.at(0);
    if (!first) throw new Error('the test world has no open plot');
    expect(nearestOpenPlot(small, first.door)).toEqual({ plot: first, path: [first.door] });
  });

  it('is nowhere when no open plot can be reached', () => {
    const doors = open.map((plot) => key(plot.door.x, plot.door.y));
    const walledOff = { ...small, blocked: new Set([...small.blocked, ...doors]) };
    expect(nearestOpenPlot(walledOff, small.start)).toBeUndefined();
  });
});

describe('the tag of a square the map knows nothing more of', () => {
  it("names a booth by its owner's login while its frame has not said its name", () => {
    expect(tagText({ kind: 'booth', id: 'elf' }, undefined)).toEqual({
      name: 'elf',
      owner: '@elf',
      line: '',
      hint: 'E or click to visit',
    });
  });

  it('still reads for a plot with no id at all', () => {
    expect(tagText({ kind: 'attraction' }, undefined).name).toBe('');
  });
});

describe('the tag of a sleigh platform', () => {
  const label = { name: 'Ana land', by: '@ana', closed: false };

  it('offers the ride to an open level, and names who made it', () => {
    expect(platformTag('platform', label)).toEqual({
      name: 'Ana land',
      owner: '@ana',
      line: 'A level of its own, a sleigh ride away.',
      hint: 'E or click to ride the sleigh there',
    });
  });

  it('offers no ride to a level closed for repairs', () => {
    const tag = platformTag('platform', { ...label, closed: true });
    expect(tag.line).toBe('Closed for repairs.');
    expect(tag.hint).toBe('');
  });

  it('takes the sleigh home from inside a level', () => {
    expect(platformTag('exit', label)).toEqual({
      name: 'The sleigh home',
      owner: '',
      line: 'Back to the North Pole.',
      hint: 'E or click to ride it',
    });
  });
});

describe('a tag with nowhere clear of the player', () => {
  it('goes above its structure after all', () => {
    const viewport = { w: 120, h: 80 };
    const player = { x: 0, y: 0, w: 120, h: 80 };
    expect(placeTag({ x: 60, y: 60 }, { w: 100, h: 50 }, player, viewport)).toEqual({
      x: 10,
      y: 8,
    });
  });
});

describe('Near you, between squares just as near', () => {
  it('keeps the order they came in', () => {
    const squares = ['b', 'a', 'c'].map((id, n) => ({ id, door: { x: n === 2 ? 5 : 1, y: 0 } }));
    expect(nearYou(squares, { x: 0, y: 0 }).map((square) => square.id)).toEqual(['b', 'a', 'c']);
  });
});
