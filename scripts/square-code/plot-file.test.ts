import { describe, expect, it } from 'vitest';
import { isPlotFile, plotFileProblems } from '../square-code.ts';
import { fine, problems, rules } from './test-booth.ts';

describe("a booth's plot.json", () => {
  it('passes a plot number, and maybe the issue number', () => {
    expect(rules(fine, { 'plot.json': '{ "plot": 17 }\n' })).toEqual([]);
    expect(isPlotFile('{ "plot": 17, "issue": 80 }')).toBe(true);
  });

  it('fails anything else in it, or any other JSON file', () => {
    for (const text of [
      '{ "plot": "17" }',
      '{ "plot": 1.5 }',
      '{ "plot": 3, "note": "hi" }',
      '[3]',
      '{',
    ])
      expect(isPlotFile(text)).toBe(false);
    expect(isPlotFile(`{ "plot": 3${' '.repeat(80)}}`)).toBe(false);
    expect(rules(fine, { 'plot.json': '{ "plot": -1 }' })).toEqual(['plot-file']);
    expect(rules(fine, { 'data.json': '{ "plot": 1 }' })).toEqual(['files']);
    expect(rules(fine, { 'nested/plot.json': '{ "plot": 1 }' })).toEqual(['files']);
  });
});

describe('plotFileProblems', () => {
  const folder = 'carnival/booths/elf/';
  const file = (name: string, status: string, previous_filename?: string) => ({
    filename: `${folder}${name}`,
    status,
    ...(previous_filename ? { previous_filename: `${folder}${previous_filename}` } : {}),
  });

  it("lets a new booth's first pull request add plot.json", () => {
    expect(
      plotFileProblems(folder, [file('booth.ts', 'added'), file('plot.json', 'added')]),
    ).toEqual([]);
  });

  it('lets an update that leaves plot.json alone through', () => {
    expect(plotFileProblems(folder, [file('booth.ts', 'modified')])).toEqual([]);
  });

  it("stops an existing booth's plot.json being added, changed, renamed or removed", () => {
    for (const change of [
      file('plot.json', 'added'),
      file('plot.json', 'modified'),
      file('plot.json', 'removed'),
      file('spot.json', 'renamed', 'plot.json'),
    ])
      expect(
        plotFileProblems(folder, [file('booth.ts', 'modified'), change]).map((p) => p.rule),
      ).toEqual(['plot-file']);
  });
});

describe('the JSON problems', () => {
  it('name the file, with no line, and say what plot.json may hold', () => {
    expect(problems(fine, { 'plot.json': '{}' })).toEqual([
      {
        file: 'carnival/booths/grinch/plot.json',
        line: 0,
        rule: 'plot-file',
        message: 'plot.json holds only { "plot": <number> }, and maybe "issue": <number>.',
      },
    ]);
    expect(problems(fine, { 'data.json': '{}' })).toEqual([
      {
        file: 'carnival/booths/grinch/data.json',
        line: 0,
        rule: 'files',
        message: 'The only JSON file a booth has is its own plot.json.',
      },
    ]);
  });

  it('fail a plot.json that is a number, null or a string', () => {
    for (const text of ['17', 'null', '"17"']) expect(isPlotFile(text)).toBe(false);
  });

  it("stop a new booth's plot.json only when its booth.ts was not added", () => {
    const folder = 'carnival/booths/elf/';
    const plot = { filename: `${folder}plot.json`, status: 'added' };
    expect(
      plotFileProblems(folder, [plot, { filename: `${folder}booth.ts`, status: 'modified' }]),
    ).toHaveLength(1);
    expect(
      plotFileProblems(folder, [plot, { filename: `${folder}README.md`, status: 'added' }]),
    ).toHaveLength(1);
    expect(
      plotFileProblems(folder, [
        plot,
        { filename: 'carnival/booths/elk/booth.ts', status: 'added' },
      ]),
    ).toHaveLength(1);
  });
});
