import { describe, expect, it } from 'vitest';
import {
  addedLines,
  diffBranchCoverage,
  diffCoverage,
  isGated,
  type FileCoverage,
} from './diff-coverage';

const diff = [
  'diff --git a/src/spot.ts b/src/spot.ts',
  '+++ b/src/spot.ts',
  '@@ -1,0 +2,3 @@',
  '@@ -9 +12 @@',
  '+++ b/carnival/booths/ana/booth.ts',
  '@@ -0,0 +1,2 @@',
].join('\n');

const statement = (line: number) => ({ start: { line }, end: { line } });

describe('addedLines', () => {
  it('reads the lines each file gains from every hunk', () => {
    expect(addedLines(diff).get('src/spot.ts')).toEqual(new Set([2, 3, 4, 12]));
  });

  it('reads many-digit hunks, and no header or hunk inside an added line', () => {
    const lines = [
      '@@ -1 +1 @@',
      '+++ b/src/a.ts',
      '@@ -12,34 +5,12 @@',
      '+@@ -1 +40 @@',
      '-+++ b/src/fake.ts',
    ].join('\n');
    const added = addedLines(lines);
    expect([...added.keys()]).toEqual(['src/a.ts']);
    expect(added.get('src/a.ts')).toEqual(new Set(Array.from({ length: 12 }, (_, n) => n + 5)));
  });
});

describe('isGated', () => {
  it('holds map and tooling code to the rule, not squares, tests or types', () => {
    expect(isGated('src/northpole/world.ts')).toBe(true);
    expect(isGated('scripts/booth-gate.ts')).toBe(true);
    expect(isGated('carnival/booths/ana/booth.ts')).toBe(false);
    expect(isGated('src/world.test.ts')).toBe(false);
    expect(isGated('lint/file-size.d.ts')).toBe(false);
    expect(isGated('docs/src/a.ts')).toBe(false);
    expect(isGated('src/a.tsx')).toBe(false);
    expect(isGated('src/data.json')).toBe(false);
    expect(isGated('src/a.d.ts.js')).toBe(true);
  });
});

describe('diffCoverage', () => {
  const coverage: Record<string, FileCoverage> = {
    'src/spot.ts': {
      statementMap: { 0: statement(2), 1: statement(3), 2: statement(12) },
      s: { 0: 1, 1: 0, 2: 4 },
    },
  };

  it('counts added lines with statements, and names the ones no test ran', () => {
    expect(diffCoverage(addedLines(diff), coverage)).toEqual({
      total: 3,
      covered: 2,
      missing: ['src/spot.ts:3'],
    });
  });

  it('counts every added line of a gated file no test loaded as missing', () => {
    const added = new Map([['scripts/new.ts', new Set([1, 2])]]);
    expect(diffCoverage(added, {}).missing).toEqual(['scripts/new.ts:1', 'scripts/new.ts:2']);
    const unordered = new Map([['scripts/new.ts', new Set([10, 9])]]);
    expect(diffCoverage(unordered, {}).missing).toEqual(['scripts/new.ts:9', 'scripts/new.ts:10']);
  });
});

describe('diffBranchCoverage', () => {
  const arm = (line: number) => ({ start: { line }, end: { line } });
  const coverage: Record<string, FileCoverage> = {
    'src/spot.ts': {
      statementMap: {},
      s: {},
      // An if/else on added line 3 (one arm never ran), and a ?: on line 9, not added.
      branchMap: { 0: { locations: [arm(3), arm(4)] }, 1: { locations: [arm(9), arm(9)] } },
      b: { 0: [2, 0], 1: [0, 0] },
    },
  };

  it('counts the branch arms that start on added lines, and names the ones no test took', () => {
    const added = new Map([['src/spot.ts', new Set([3, 4])]]);
    expect(diffBranchCoverage(added, coverage)).toEqual({
      total: 2,
      covered: 1,
      missing: ['src/spot.ts:4 (a branch no test took)'],
    });
  });

  it('counts an arm with no recorded hits as one no test took', () => {
    const added = new Map([['src/odd.ts', new Set([2])]]);
    const odd: Record<string, FileCoverage> = {
      'src/odd.ts': { statementMap: {}, s: {}, branchMap: { 7: { locations: [arm(2)] } }, b: {} },
    };
    expect(diffBranchCoverage(added, odd).missing).toEqual([
      'src/odd.ts:2 (a branch no test took)',
    ]);
  });

  it('leaves out squares, tests, and files without branch data', () => {
    const added = new Map([
      ['carnival/booths/ana/booth.ts', new Set([1])],
      ['src/spot.test.ts', new Set([1])],
      ['scripts/plain.ts', new Set([1])],
      ['scripts/unloaded.ts', new Set([1])],
    ]);
    const square = { ...coverage['src/spot.ts'], branchMap: { 0: { locations: [arm(1)] } } };
    const data = {
      'scripts/plain.ts': { statementMap: {}, s: {} },
      'carnival/booths/ana/booth.ts': square,
      'src/spot.test.ts': square,
    };
    expect(diffBranchCoverage(added, data as Record<string, FileCoverage>)).toEqual({
      total: 0,
      covered: 0,
      missing: [],
    });
  });
});
