import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readSquare, report, squareFolders } from './check-square';

describe('squareFolders', () => {
  it('finds every booth, attraction and level square', () => {
    const folders = squareFolders('.');
    expect(folders).toContain('carnival/booths/jedi4ever');
    expect(folders).toContain('carnival/attractions/ferris-wheel');
    expect(folders).toContain('carnival/levels/jedi4ever/squares/cocoa-hut');
  });
});

describe('readSquare', () => {
  it("reads a square's files by their path inside it", () => {
    expect(Object.keys(readSquare('carnival/attractions/ferris-wheel')).sort()).toEqual([
      'README.md',
      'attraction.test.ts',
      'attraction.ts',
      'elves.ts',
      'game.test.ts',
      'game.ts',
      'hud.ts',
      'ride.ts',
      'view.ts',
    ]);
  });

  it('reads the files in folders inside the square too', () => {
    const square = mkdtempSync(join(tmpdir(), 'square-'));
    mkdirSync(join(square, 'parts'));
    writeFileSync(join(square, 'booth.ts'), 'export {};\n');
    writeFileSync(join(square, 'parts', 'sky.ts'), 'export {};\n');
    expect(Object.keys(readSquare(square)).sort()).toEqual(['booth.ts', join('parts', 'sky.ts')]);
  });

  it("gives a level's square the level's README", () => {
    expect(readSquare('carnival/levels/jedi4ever/squares/cocoa-hut')['README.md']).toMatch(/#/);
  });
});

describe('report', () => {
  it('lists the badges earned and what to fix', () => {
    expect(
      report('carnival/booths/ana', { badges: ['tested'], problems: ['booth.ts is 300 lines'] }),
    ).toBe('carnival/booths/ana: tested\n  - booth.ts is 300 lines');
    expect(report('carnival/booths/ana', { badges: [], problems: [] })).toBe(
      'carnival/booths/ana: none yet',
    );
  });
});
