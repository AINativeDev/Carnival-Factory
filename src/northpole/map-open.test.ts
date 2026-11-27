// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLAIM_URL, REPO_URL } from './links';
import { enter, named, open, select } from './map-open';
import { remembered, type MapRun } from './map-state';
import type { Spot, World } from './world';

/** A spot of `kind` at (4, 4), its door at (6, 4). */
const spotOf = (kind: Spot['kind'], id?: string): Spot => ({
  kind,
  ...(id === undefined ? {} : { id }),
  number: 3,
  x: 4,
  y: 4,
  w: 2,
  h: 2,
  door: { x: 6, y: 4 },
});

/** The parts of a running map that opening and picking read and change. */
function running(spots: Spot[] = []) {
  const onOpen = vi.fn();
  const onTravel = vi.fn();
  const onSelect = vi.fn();
  const fields: Partial<MapRun> = {
    options: { onOpen, onTravel, onSelect } as unknown as MapRun['options'],
    pending: new Map([['ana', { login: 'ana', issue: 42, stage: 'building', spot: 9 }]]),
    stations: new Map([
      ['bo', { name: 'Bo’s level', owner: '@bo', color: '#fff', closed: false }],
      ['cy', { name: 'Cy’s level', owner: '@cy', color: '#fff', closed: true }],
    ]) as unknown as MapRun['stations'],
    place: 'north-pole',
    player: { x: 1, y: 2 },
    path: [{ x: 1, y: 3 }],
    world: { spots } as unknown as World,
    trailing: true,
    selectedAt: 1234,
  };
  return { m: fields as MapRun, onOpen, onTravel, onSelect };
}

let opened: { href: string; target: string; rel: string }[] = [];
beforeEach(() => {
  opened = [];
  remembered.clear();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    opened.push({ href: this.href, target: this.target, rel: this.rel });
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('opening a spot', () => {
  it('opens the booth form in a new tab for a free spot', () => {
    const { m, onOpen } = running();
    open(m, spotOf('open'));
    expect(opened).toEqual([{ href: CLAIM_URL, target: '_blank', rel: 'noopener' }]);
    expect(onOpen).not.toHaveBeenCalled();
    expect(remembered.size).toBe(0);
  });

  it("opens a booth being built's request, or the form when the request isn't known", () => {
    const { m } = running();
    open(m, spotOf('site', 'ana'));
    open(m, spotOf('site', 'zed'));
    expect(opened.map(({ href }) => href)).toEqual([`${REPO_URL}/issues/42`, CLAIM_URL]);
    expect(remembered.size).toBe(0);
  });

  it('opens a booth or an attraction, remembering where the player stood', () => {
    const { m, onOpen, onTravel } = running();
    open(m, spotOf('booth', 'ana'));
    expect(onOpen).toHaveBeenCalledWith('booth', 'ana');
    expect(onTravel).not.toHaveBeenCalled();
    expect(remembered.get('north-pole')).toEqual({ x: 1, y: 2 });
    expect(remembered.get('north-pole')).not.toBe(m.player);
    expect(opened).toEqual([]);
  });

  it('takes the sleigh home from an exit, and to an open level from its platform', () => {
    const { m, onOpen, onTravel } = running();
    open(m, spotOf('exit'));
    open(m, spotOf('platform', 'bo'));
    open(m, spotOf('platform', 'cy'));
    expect(onTravel.mock.calls).toEqual([[undefined], ['bo']]);
    expect(onOpen).not.toHaveBeenCalled();
    expect(remembered.get('north-pole')).toEqual({ x: 1, y: 2 });
  });
});

describe('picking a spot', () => {
  it('tells the page which square is picked, once, and stops any walk there', () => {
    const { m, onSelect } = running();
    const spot = spotOf('booth', 'ana');
    select(m, spot);
    select(m, spot);
    expect(onSelect.mock.calls).toEqual([[{ kind: 'booth', id: 'ana' }]]);
    expect([m.selected, m.selectedAt, m.trailing]).toEqual([spot, undefined, false]);
    select(m, undefined);
    expect(onSelect.mock.calls.at(-1)).toEqual([undefined]);
    expect(m.selected).toBeUndefined();
  });

  it('names a spot as the page does', () => {
    expect(named(spotOf('attraction', 'big-top'))).toEqual({ kind: 'attraction', id: 'big-top' });
  });
});

describe('entering a spot from the map', () => {
  it('puts the player at its door first when they are elsewhere', () => {
    const spot = spotOf('booth', 'ana');
    const { m, onOpen } = running([spot]);
    enter(m, spot);
    expect([m.player, m.path]).toEqual([{ x: 6, y: 4 }, []]);
    expect(m.player).not.toBe(spot.door);
    expect(onOpen).toHaveBeenCalledWith('booth', 'ana');
  });

  it('leaves the player and their walk alone at its door', () => {
    const spot = spotOf('booth', 'ana');
    const { m } = running([spot]);
    m.player = { x: 6.2, y: 4 };
    enter(m, spot);
    expect([m.player, m.path]).toEqual([{ x: 6.2, y: 4 }, [{ x: 1, y: 3 }]]);
  });
});
