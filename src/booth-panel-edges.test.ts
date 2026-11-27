import { describe, expect, it } from 'vitest';
import { fold, page, readState, search, step, type PanelEntry } from './booth-panel';

const booth = (id: string, name = id): PanelEntry => ({ kind: 'booth', id, name });

describe('folding text for a search', () => {
  it('drops only the @ signs it starts with', () => {
    expect(fold('@@ana')).toBe('ana');
    expect(fold('ana@north.pole')).toBe('ana@north.pole');
  });
});

describe('ranking what a search finds', () => {
  it('puts a login or name that starts with the search first, not one that ends with it', () => {
    const found = search([booth('xab', 'Aaa'), booth('abz', 'Zzz')], 'ab');
    expect(found.map((entry) => entry.id)).toEqual(['abz', 'xab']);
  });
});

describe('a page of a list', () => {
  it('has no more to show when the page holds it all', () => {
    expect(page([1, 2, 3], 3)).toEqual({ items: [1, 2, 3], more: false });
    expect(page([1, 2, 3], 2)).toEqual({ items: [1, 2], more: true });
  });
});

describe('the arrow keys through a list', () => {
  it('step on from where they are, the first entry included', () => {
    expect(step(0, 5, 1)).toBe(1);
    expect(step(2, 5, -1)).toBe(1);
    expect(step(-1, 5, -1)).toBe(4);
  });
});

describe("the panel's remembered state, read back", () => {
  it('keeps a login with nothing round it, and forgets anything else', () => {
    expect(readState('{"me":" ana"}').me).toBeUndefined();
    expect(readState('{"me":"ana!"}').me).toBeUndefined();
    expect(readState('{"me":"Ana-2"}').me).toBe('ana-2');
  });

  it('keeps the folds when who you are is malformed', () => {
    expect(readState('{"me":5,"closed":["all"]}')).toEqual({ me: undefined, closed: ['all'] });
  });

  it('keeps at most ten folds', () => {
    const closed = Array.from({ length: 12 }, (_, n) => `s${String(n)}`);
    expect(readState(JSON.stringify({ closed })).closed).toEqual(closed.slice(0, 10));
  });
});
