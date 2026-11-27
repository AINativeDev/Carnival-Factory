import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

  it('passes over a folder without its own kind of file', () => {
    const root = mkdtempSync(join(tmpdir(), 'history-squares-'));
    const square = (kind: string, id: string, file?: string) => {
      mkdirSync(join(root, 'carnival', `${kind}s`, id), { recursive: true });
      if (file) writeFileSync(join(root, 'carnival', `${kind}s`, id, file), '');
    };
    square('booth', 'ana', 'booth.ts');
    square('booth', 'empty');
    square('attraction', 'wheel', 'attraction.ts');
    square('level', 'bo', 'level.ts');
    square('level', 'mixed', 'booth.ts');
    expect(squaresOnDisk(root)).toEqual(['booth/ana', 'attraction/wheel', 'level/bo']);
  });
});
