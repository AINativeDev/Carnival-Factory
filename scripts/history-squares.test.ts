import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { squaresOnDisk } from './history-squares.ts';

describe('squaresOnDisk', () => {
  it("lists the repository's booths, attractions and levels, and only folders with their file", () => {
    const squares = squaresOnDisk(join(import.meta.dirname, '..'));
    expect(squares).toEqual(
      expect.arrayContaining(['booth/jedi4ever', 'attraction/ferris-wheel', 'level/jedi4ever']),
    );
    expect(squares.every((square) => /^(booth|attraction|level)\/[^/.]+$/.test(square))).toBe(true);
  });
});
