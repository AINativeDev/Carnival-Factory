import { describe, expect, it } from 'vitest';
import { compare, errorsByFile, linesAbout } from './strict-types';

describe('errorsByFile', () => {
  it('counts the errors tsc reports for each file', () => {
    const output = [
      "src/a.ts(3,5): error TS2532: Object is possibly 'undefined'.",
      "src/a.ts(9,1): error TS2532: Object is possibly 'undefined'.",
      'scripts/b.ts(1,1): error TS2375: Type is not assignable.',
      '  a continuation line',
    ].join('\n');
    expect(errorsByFile(output)).toEqual({ 'src/a.ts': 2, 'scripts/b.ts': 1 });
  });
});

describe('compare', () => {
  it('fails new errors, including any in a file with none allowed', () => {
    expect(compare({ 'src/a.ts': 3, 'src/new.ts': 1 }, { 'src/a.ts': 2 }).worse).toEqual([
      'src/a.ts: 3 strict type errors, 2 allowed',
      'src/new.ts: 1 strict type errors, 0 allowed',
    ]);
  });

  it('asks for the baseline to come down when a file improves, or is fixed', () => {
    expect(compare({ 'src/a.ts': 1 }, { 'src/a.ts': 2, 'src/b.ts': 4 })).toEqual({
      worse: [],
      better: ['src/a.ts: 1 now, baseline says 2', 'src/b.ts: 0 now, baseline says 4'],
    });
  });

  it('lets a carnival file improve without touching the baseline, which is outside its folder', () => {
    expect(compare({}, { 'carnival/booths/ana/booth.ts': 3 }).better).toEqual([]);
  });
});

describe('linesAbout', () => {
  it("keeps only the compiler's lines about the files that got worse", () => {
    const output = 'src/a.ts(1,1): error TS1: x\nsrc/b.ts(2,2): error TS2: y';
    expect(linesAbout(output, ['src/b.ts'])).toBe('src/b.ts(2,2): error TS2: y');
  });
});
