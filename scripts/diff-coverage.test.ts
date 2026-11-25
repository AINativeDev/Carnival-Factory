import { describe, expect, it } from 'vitest';
import { addedLines, diffCoverage, isGated, type FileCoverage } from './diff-coverage';

const diff = [
  'diff --git a/src/plot.ts b/src/plot.ts',
  '+++ b/src/plot.ts',
  '@@ -1,0 +2,3 @@',
  '@@ -9 +12 @@',
  '+++ b/carnival/booths/ana/booth.ts',
  '@@ -0,0 +1,2 @@',
].join('\n');

const statement = (line: number) => ({ start: { line }, end: { line } });

describe('addedLines', () => {
  it('reads the lines each file gains from every hunk', () => {
    expect(addedLines(diff).get('src/plot.ts')).toEqual(new Set([2, 3, 4, 12]));
  });
});

describe('isGated', () => {
  it('holds map and tooling code to the rule, not squares, tests or types', () => {
    expect(isGated('src/northpole/world.ts')).toBe(true);
    expect(isGated('scripts/booth-gate.ts')).toBe(true);
    expect(isGated('carnival/booths/ana/booth.ts')).toBe(false);
    expect(isGated('src/world.test.ts')).toBe(false);
    expect(isGated('lint/file-size.d.ts')).toBe(false);
  });
});

describe('diffCoverage', () => {
  const coverage: Record<string, FileCoverage> = {
    'src/plot.ts': {
      statementMap: { 0: statement(2), 1: statement(3), 2: statement(12) },
      s: { 0: 1, 1: 0, 2: 4 },
    },
  };

  it('counts added lines with statements, and names the ones no test ran', () => {
    expect(diffCoverage(addedLines(diff), coverage)).toEqual({
      total: 3,
      covered: 2,
      missing: ['src/plot.ts:3'],
    });
  });

  it('counts every added line of a gated file no test loaded as missing', () => {
    const added = new Map([['scripts/new.ts', new Set([1, 2])]]);
    expect(diffCoverage(added, {}).missing).toEqual(['scripts/new.ts:1', 'scripts/new.ts:2']);
  });
});
