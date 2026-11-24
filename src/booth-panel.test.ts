import { describe, expect, it } from 'vitest';
import {
  byName,
  fold,
  heading,
  matches,
  page,
  readState,
  recentlyAdded,
  search,
  step,
  type PanelEntry,
} from './booth-panel';

const booth = (id: string, name: string): PanelEntry => ({ kind: 'booth', id, name });

describe('searching the Booths panel', () => {
  const squares = [
    booth('jedi4ever', "Santa's Toy Factory"),
    booth('zoe', 'Crème Brûlée Café'),
    booth('ana', 'Ice Rink'),
    { kind: 'attraction', id: 'ferris-wheel', name: 'Ferris Wheel' } as PanelEntry,
  ];

  it('folds case, accents and a leading @', () => {
    expect(fold('  @Crème BRÛLÉE ')).toBe('creme brulee');
  });

  it('matches by name or login, ignoring case and accents', () => {
    expect(matches(squares[1], 'creme')).toBe(true);
    expect(matches(squares[1], '@ZOE')).toBe(true);
    expect(matches(squares[0], 'toy f')).toBe(true);
    expect(matches(squares[0], 'rink')).toBe(false);
  });

  it('finds nothing for an empty search', () => {
    expect(search(squares, '  ')).toEqual([]);
  });

  it('puts squares that start with the search first, then A to Z', () => {
    const found = search(squares, 'i');
    expect(found.map((square) => square.id)).toEqual(['ana', 'ferris-wheel', 'jedi4ever']);
  });
});

describe('sorting and paging', () => {
  it('sorts A to Z by name, ignoring case and accents', () => {
    const sorted = byName([booth('b', 'éclair'), booth('a', 'Apple'), booth('c', 'dough')]);
    expect(sorted.map((square) => square.name)).toEqual(['Apple', 'dough', 'éclair']);
  });

  it('shows a page at a time and says when there are more', () => {
    const list = Array.from({ length: 45 }, (_, n) => n);
    expect(page(list, 20)).toEqual({ items: list.slice(0, 20), more: true });
    expect(page(list, 60)).toEqual({ items: list, more: false });
  });

  it('counts each heading', () => {
    expect(heading('All booths', 42)).toBe('All booths (42)');
  });

  it('steps through results with the arrow keys, wrapping', () => {
    expect(step(-1, 3, 1)).toBe(0);
    expect(step(-1, 3, -1)).toBe(2);
    expect(step(2, 3, 1)).toBe(0);
    expect(step(0, 3, -1)).toBe(2);
    expect(step(-1, 0, 1)).toBe(-1);
  });
});

describe('Recently added', () => {
  it('lists the newest booths first, leaving out any without a date', () => {
    const booths = ['old', 'new', 'mid', 'none'].map((id) => booth(id, id));
    const added = {
      old: '2026-11-01T10:00:00Z',
      new: '2026-11-20T10:00:00Z',
      mid: '2026-11-10T10:00:00Z',
    };
    expect(recentlyAdded(booths, added).map((b) => b.id)).toEqual(['new', 'mid', 'old']);
    expect(recentlyAdded(booths, added, 1).map((b) => b.id)).toEqual(['new']);
  });
});

describe("the panel's remembered state", () => {
  it('reads who you are and which sections are folded', () => {
    expect(readState('{"me":"Jedi4ever","closed":["near"]}')).toEqual({
      me: 'jedi4ever',
      closed: ['near'],
    });
  });

  it('ignores anything malformed', () => {
    expect(readState('not json')).toEqual({ closed: [] });
    expect(readState(null)).toEqual({ closed: [] });
    expect(readState('{"me":"<img>","closed":[1,"all"]}')).toEqual({ closed: ['all'] });
  });
});
