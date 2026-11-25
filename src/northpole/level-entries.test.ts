import { afterEach, describe, expect, it, vi } from 'vitest';
import starter from '../../carnival/levels/jedi4ever/level';
import { levelEntries, squaresByLevel, type LevelEntry } from './levels';

const STARTER = '../../carnival/levels/jedi4ever/level.ts';
const starterSquares = (starter.squares ?? []).map(
  ({ id }) => `../../carnival/levels/jedi4ever/squares/${id}/square.ts`,
);

/** The one level in `entries`, or a failed test. */
const onlyLevel = (entries: LevelEntry[]) => {
  const entry = entries.at(0);
  if (!entry || entries.length > 1)
    throw new Error(`expected one level, got ${String(entries.length)}`);
  return entry;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("each level's own squares", () => {
  it('are found by login from their folders', () => {
    expect(squaresByLevel(['../../carnival/levels/ana/squares/igloo/square.ts'])).toEqual(
      new Map([['ana', ['igloo']]]),
    );
  });
});

describe('the levels at the station', () => {
  it('opens a level that passes its checks, with each of its squares sandboxed', () => {
    const entry = onlyLevel(levelEntries({ [STARTER]: starter }, starterSquares, new Set()));
    expect(starterSquares).not.toHaveLength(0);
    expect(entry.closed).toBeUndefined();
    expect(entry.name).toBe(starter.name);
    expect(entry.squares.map((square) => square.id).sort()).toEqual(
      (starter.squares ?? []).map(({ id }) => id).sort(),
    );
  });

  it('closes a broken level, says why in the console, and runs none of its squares', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const entry = onlyLevel(
      levelEntries({ '../../carnival/levels/ana/level.ts': {} }, [], new Set()),
    );
    expect(entry.login).toBe('ana');
    expect(entry.squares).toEqual([]);
    expect(entry.closed).toBeTruthy();
    expect(error).toHaveBeenCalledOnce();
  });

  it('closes a switched-off level without checking it', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const entry = onlyLevel(
      levelEntries({ '../../carnival/levels/ana/level.ts': {} }, [], new Set(['ana'])),
    );
    expect(entry.closed).toBe('off');
    expect(error).not.toHaveBeenCalled();
  });

  it('lists the levels in order of login', () => {
    const files = {
      '../../carnival/levels/zed/level.ts': {},
      '../../carnival/levels/amy/level.ts': {},
    };
    const logins = levelEntries(files, [], new Set(['amy', 'zed'])).map((entry) => entry.login);
    expect(logins).toEqual(['amy', 'zed']);
  });
});
