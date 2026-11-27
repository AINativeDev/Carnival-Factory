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

/** A made-up repository in a temporary folder, with `files` written at their paths. */
function repository(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'carnival-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

describe('squareFolders, in a made-up repository', () => {
  it('lists only folders, booths first, then attractions, then each level’s squares', () => {
    const root = repository({
      'carnival/booths/ana/booth.ts': '',
      'carnival/booths/notes.md': '',
      'carnival/attractions/wheel/attraction.ts': '',
      'carnival/levels/bo/README.md': '',
      'carnival/levels/bo/squares/hut/square.ts': '',
      'carnival/levels/bo/squares/notes.md': '',
    });
    expect(squareFolders(root)).toEqual([
      'carnival/booths/ana',
      'carnival/attractions/wheel',
      'carnival/levels/bo/squares/hut',
    ]);
  });
});

describe("readSquare and a level's README", () => {
  it("keeps a level square's own README", () => {
    const root = repository({
      'carnival/levels/bo/README.md': 'The level.',
      'carnival/levels/bo/squares/hut/README.md': 'The hut.',
    });
    expect(readSquare(join(root, 'carnival/levels/bo/squares/hut'))['README.md']).toBe('The hut.');
  });

  it('gives a booth no README of its own, and a level square none when its level has none', () => {
    const root = repository({
      'carnival/README.md': 'Not the booth’s.',
      'carnival/booths/ana/booth.ts': '',
      'carnival/levels/bo/squares/hut/square.ts': '',
    });
    expect(readSquare(join(root, 'carnival/booths/ana'))).toEqual({ 'booth.ts': '' });
    expect(readSquare(join(root, 'carnival/levels/bo/squares/hut'))).toEqual({ 'square.ts': '' });
  });

  it("gives a level square its level's README, word for word", () => {
    const root = repository({
      'carnival/levels/bo/README.md': 'The level.',
      'carnival/levels/bo/squares/hut/square.ts': '',
    });
    expect(readSquare(join(root, 'carnival/levels/bo/squares/hut'))).toEqual({
      'square.ts': '',
      'README.md': 'The level.',
    });
  });
});

describe('report, with nothing left to fix', () => {
  it('lists every badge earned, and nothing after', () => {
    expect(report('carnival/booths/ana', { badges: ['tested', 'documented'], problems: [] })).toBe(
      'carnival/booths/ana: tested, documented',
    );
    expect(report('carnival/booths/ana', { badges: [], problems: ['a', 'b'] })).toBe(
      'carnival/booths/ana: none yet\n  - a\n  - b',
    );
  });
});
