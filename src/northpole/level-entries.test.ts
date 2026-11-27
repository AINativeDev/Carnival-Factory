import { afterEach, describe, expect, it, vi } from 'vitest';
import starter from '../../carnival/levels/jedi4ever/level';
import { levelEntries, squaresByLevel } from './levels';
import { validateLevel } from './level-check';
import { sandboxedSquare } from './sandbox';

// Each square of an open level runs in its own frame: the test only sees which frames it asks for.
vi.mock('./sandbox', () => ({
  sandboxedSquare: vi.fn((kind: string, id: string) => ({ id, kind })),
}));
const sandboxed = vi.mocked(sandboxedSquare);

/**
 * The station's levels from their files, without the real folders: which
 * squares belong to which level, and an open, a broken and a switched-off one.
 */
const levelFile = (login: string) => `../../carnival/levels/${login}/level.ts`;
const squareFile = (login: string, id: string) =>
  `../../carnival/levels/${login}/squares/${id}/square.ts`;
const starterSquares = (starter.squares ?? []).map(({ id }) => squareFile('jedi4ever', id));

afterEach(() => {
  vi.restoreAllMocks();
  sandboxed.mockClear();
});

describe('squaresByLevel', () => {
  it("names each level's squares by their folders, in order, by the level's folder", () => {
    const byLevel = squaresByLevel([
      squareFile('bo', 'z'),
      squareFile('al', 'y'),
      squareFile('bo', 'x'),
    ]);
    expect([...byLevel]).toEqual([
      ['al', ['y']],
      ['bo', ['x', 'z']],
    ]);
  });
});

describe('levelEntries', () => {
  it('opens a valid level with its data, its owner and its squares, sandboxed by their ids', () => {
    const entry = levelEntries({ [levelFile('jedi4ever')]: starter }, starterSquares, new Set()).at(
      0,
    );
    const ids = [...(starter.squares ?? []).map(({ id }) => id)].sort();
    expect(entry).toMatchObject({
      login: 'jedi4ever',
      name: starter.name,
      description: starter.description,
      owner: '@jedi4ever',
      level: starter,
    });
    expect(entry?.closed).toBeUndefined();
    expect(entry?.squares.map((square) => square.id)).toEqual(ids);
    expect(sandboxed.mock.calls).toEqual(ids.map((id) => ['level', id, 'jedi4ever']));
  });

  it('opens a level with no squares and no square folders', () => {
    const bare = { ...starter, squares: [] };
    const entry = levelEntries({ [levelFile('jedi4ever')]: bare }, [], new Set()).at(0);
    expect(entry?.closed).toBeUndefined();
    expect(entry?.squares).toEqual([]);
  });

  it('closes a level that fails its checks, says why once, and runs none of its squares', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = { ...starter, id: 'broken' };
    const why = validateLevel(broken, 'broken', []).join('; ');
    expect(why).not.toBe('');
    expect(levelEntries({ [levelFile('broken')]: broken }, [], new Set())).toEqual([
      {
        login: 'broken',
        name: 'broken',
        description: '',
        owner: '@broken',
        squares: [],
        closed: why,
      },
    ]);
    expect(error.mock.calls).toEqual([[`The level broken is closed for repairs: ${why}`]]);
  });

  it('closes a switched-off level without checking it, and sorts the station by login', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const entries = levelEntries(
      { [levelFile('zed')]: {}, [levelFile('jedi4ever')]: starter, [levelFile('amy')]: {} },
      starterSquares,
      new Set(['zed', 'amy']),
    );
    expect(entries.map(({ login, closed }) => [login, closed])).toEqual([
      ['amy', 'off'],
      ['jedi4ever', undefined],
      ['zed', 'off'],
    ]);
    expect(error).not.toHaveBeenCalled();
  });
});
