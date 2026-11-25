/**
 * Holds the lines a change adds to 99% unit-test coverage, while the whole
 * repository's coverage climbs towards it (docs/adr/0025-test-coverage.md).
 * Test-first work passes this without effort; code written without its test
 * doesn't. Squares in carnival/ are left out: the smoke test draws every one
 * end to end, and their pure logic has unit tests of its own.
 *
 * Run after `vitest run --coverage`: `node scripts/diff-coverage.ts <base>`,
 * where <base> is the commit to compare with (origin/main in CI).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

export const REQUIRED = 0.99;

/** Istanbul's per-file coverage, as vitest writes it to coverage-final.json. */
export interface FileCoverage {
  statementMap: Record<string, { start: { line: number }; end: { line: number } }>;
  s: Record<string, number>;
}

/** The lines each file gains, from `git diff -U0` output. */
export function addedLines(diff: string): Map<string, Set<number>> {
  const added = new Map<string, Set<number>>();
  let lines: Set<number> | undefined;
  for (const line of diff.split('\n')) {
    const file = line.match(/^\+\+\+ b\/(.+)$/);
    if (file) {
      lines = new Set();
      added.set(file[1], lines);
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (hunk && lines) {
      const start = Number(hunk[1]);
      const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
      for (let n = start; n < start + count; n++) lines.add(n);
    }
  }
  return added;
}

/** Whether a changed file is held to the rule: map and tooling code, not squares or tests. */
export const isGated = (file: string) =>
  /^(src|scripts|lint)\/.+\.(ts|js)$/.test(file) && !/\.(test|d)\.ts$/.test(file);

export interface DiffCoverage {
  total: number;
  covered: number;
  missing: string[];
}

/**
 * Of the added lines that hold a statement, how many ran under the tests. A file
 * with no coverage data at all counts every added line as missing, since nothing
 * loaded it.
 */
export function diffCoverage(
  added: Map<string, Set<number>>,
  coverage: Record<string, FileCoverage>,
): DiffCoverage {
  const result: DiffCoverage = { total: 0, covered: 0, missing: [] };
  for (const [file, lines] of added) {
    if (!isGated(file) || lines.size === 0) continue;
    const data = coverage[file];
    for (const line of [...lines].sort((a, b) => a - b)) {
      const statements = data
        ? Object.entries(data.statementMap).filter(
            ([, at]) => at.start.line <= line && line <= at.end.line,
          )
        : [];
      if (data && statements.length === 0) continue;
      result.total++;
      if (statements.some(([id]) => data!.s[id] > 0)) result.covered++;
      else result.missing.push(`${file}:${line}`);
    }
  }
  return result;
}

/* v8 ignore start -- the command-line entry point, run by CI and the hooks */
if (process.argv[1]?.endsWith('diff-coverage.ts')) {
  const base = process.argv[2] ?? 'origin/main';
  const diff = execFileSync('git', [
    'diff',
    '-U0',
    base,
    'HEAD',
    '--',
    'src',
    'scripts',
    'lint',
  ]).toString();
  const root = process.cwd();
  const raw = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf8')) as Record<
    string,
    FileCoverage
  >;
  const coverage = Object.fromEntries(
    Object.entries(raw).map(([path, data]) => [relative(root, path), data]),
  );
  const { total, covered, missing } = diffCoverage(addedLines(diff), coverage);
  const share = total ? covered / total : 1;
  console.log(`Changed lines covered: ${covered} of ${total} (${(share * 100).toFixed(1)}%)`);
  if (share < REQUIRED) {
    console.error(`Below ${REQUIRED * 100}%. Write the tests for:\n${missing.join('\n')}`);
    process.exit(1);
  }
}
/* v8 ignore stop */
