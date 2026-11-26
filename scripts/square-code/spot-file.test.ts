import { describe, expect, it } from 'vitest';
import { isSpotFile, spotFileProblems } from '../square-code.ts';
import { fine, problems, rules } from './test-booth.ts';

describe("a booth's spot.json", () => {
  it('passes a spot number, and maybe the issue number', () => {
    expect(rules(fine, { 'spot.json': '{ "spot": 17 }\n' })).toEqual([]);
    expect(isSpotFile('{ "spot": 17, "issue": 80 }')).toBe(true);
  });

  it('fails anything else in it, or any other JSON file', () => {
    for (const text of [
      '{ "spot": "17" }',
      '{ "spot": 1.5 }',
      '{ "spot": 3, "note": "hi" }',
      '[3]',
      '{',
    ])
      expect(isSpotFile(text)).toBe(false);
    expect(isSpotFile(`{ "spot": 3${' '.repeat(80)}}`)).toBe(false);
    expect(rules(fine, { 'spot.json': '{ "spot": -1 }' })).toEqual(['spot-file']);
    expect(rules(fine, { 'data.json': '{ "spot": 1 }' })).toEqual(['files']);
    expect(rules(fine, { 'nested/spot.json': '{ "spot": 1 }' })).toEqual(['files']);
  });
});

describe('spotFileProblems', () => {
  const folder = 'carnival/booths/elf/';
  const file = (name: string, status: string, previous_filename?: string) => ({
    filename: `${folder}${name}`,
    status,
    ...(previous_filename ? { previous_filename: `${folder}${previous_filename}` } : {}),
  });

  it("lets a new booth's first pull request add spot.json", () => {
    expect(
      spotFileProblems(folder, [file('booth.ts', 'added'), file('spot.json', 'added')]),
    ).toEqual([]);
  });

  it('lets an update that leaves spot.json alone through', () => {
    expect(spotFileProblems(folder, [file('booth.ts', 'modified')])).toEqual([]);
  });

  it("stops an existing booth's spot.json being added, changed, renamed or removed", () => {
    for (const change of [
      file('spot.json', 'added'),
      file('spot.json', 'modified'),
      file('spot.json', 'removed'),
      file('place.json', 'renamed', 'spot.json'),
    ])
      expect(
        spotFileProblems(folder, [file('booth.ts', 'modified'), change]).map((p) => p.rule),
      ).toEqual(['spot-file']);
  });
});

describe('the JSON problems', () => {
  it('name the file, with no line, and say what spot.json may hold', () => {
    expect(problems(fine, { 'spot.json': '{}' })).toEqual([
      {
        file: 'carnival/booths/grinch/spot.json',
        line: 0,
        rule: 'spot-file',
        message: 'spot.json holds only { "spot": <number> }, and maybe "issue": <number>.',
      },
    ]);
    expect(problems(fine, { 'data.json': '{}' })).toEqual([
      {
        file: 'carnival/booths/grinch/data.json',
        line: 0,
        rule: 'files',
        message: 'The only JSON file a booth has is its own spot.json.',
      },
    ]);
  });

  it('fail a spot.json that is a number, null or a string', () => {
    for (const text of ['17', 'null', '"17"']) expect(isSpotFile(text)).toBe(false);
  });

  it("stop a new booth's spot.json only when its booth.ts was not added", () => {
    const folder = 'carnival/booths/elf/';
    const spot = { filename: `${folder}spot.json`, status: 'added' };
    expect(
      spotFileProblems(folder, [spot, { filename: `${folder}booth.ts`, status: 'modified' }]),
    ).toHaveLength(1);
    expect(
      spotFileProblems(folder, [spot, { filename: `${folder}README.md`, status: 'added' }]),
    ).toHaveLength(1);
    expect(
      spotFileProblems(folder, [
        spot,
        { filename: 'carnival/booths/elk/booth.ts', status: 'added' },
      ]),
    ).toHaveLength(1);
  });
});
