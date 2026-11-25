import { describe, expect, it } from 'vitest';
import {
  folderCodeProblems,
  landedNote,
  mergesWithoutPerson,
  requestKind,
} from './gate-request.ts';

describe('requestKind', () => {
  it('reads a booth or a level request from its labels, and nothing else', () => {
    expect(requestKind(['booth-request', 'tessl'])).toBe('booth');
    expect(requestKind(['tessl', 'level-request'])).toBe('level');
    expect(requestKind(['tessl'])).toBeUndefined();
    expect(requestKind(['booth-request', 'level-request'])).toBeUndefined();
  });
});

describe('mergesWithoutPerson', () => {
  it('lets a booth keep its plot.json, and a level none, beside .ts and .md', () => {
    expect(
      mergesWithoutPerson(
        'booth',
        'carnival/booths/elf/',
        'carnival/booths/elf/plot.json',
        '100644',
      ),
    ).toBe(true);
    expect(
      mergesWithoutPerson(
        'level',
        'carnival/levels/elf/',
        'carnival/levels/elf/plot.json',
        '100644',
      ),
    ).toBe(false);
    expect(
      mergesWithoutPerson(
        'level',
        'carnival/levels/elf/',
        'carnival/levels/elf/squares/a/square.ts',
        '100644',
      ),
    ).toBe(true);
    expect(
      mergesWithoutPerson(
        'booth',
        'carnival/booths/elf/',
        'carnival/booths/elf/logo.png',
        '100644',
      ),
    ).toBe(false);
    expect(
      mergesWithoutPerson(
        'booth',
        'carnival/booths/elf/',
        'carnival/booths/elf/booth.ts',
        '120000',
      ),
    ).toBe(false);
  });
});

describe('folderCodeProblems', () => {
  it("checks a booth's plot.json and code, and a level's data and squares", () => {
    const booth = folderCodeProblems(
      'booth',
      'carnival/booths/elf/',
      [{ filename: 'carnival/booths/elf/plot.json', status: 'modified' }],
      [{ path: 'carnival/booths/elf/booth.ts', text: `export const x = () => fetch('/');` }],
    );
    expect(booth.map((problem) => problem.rule)).toEqual(['plot-file', 'global']);
    const level = folderCodeProblems(
      'level',
      'carnival/levels/elf/',
      [{ filename: 'carnival/levels/elf/level.ts', status: 'modified' }],
      [{ path: 'carnival/levels/elf/level.ts', text: 'console.log(1);' }],
    );
    expect(level.map((problem) => problem.rule)).toEqual(['level-data']);
  });
});

describe('landedNote', () => {
  it('tells the participant their booth or level is on the map', () => {
    expect(landedNote('booth', 7, 'https://example.com/guide')).toContain(
      'Your booth is on the map',
    );
    expect(landedNote('level', 7, 'https://example.com/guide')).toMatch(
      /^Your level is on the map\. It merged on its own in #7 .*\(https:\/\/example\.com\/guide\)/,
    );
  });
});
