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
      'ride.ts',
      'view.ts',
    ]);
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
