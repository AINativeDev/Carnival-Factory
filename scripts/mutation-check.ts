/**
 * Holds the mutation scores to their bar (scripts/mutation-score.ts,
 * docs/adr/0061-mutation-testing.md).
 *
 *   node scripts/mutation-check.ts --changed origin/main
 *     mutates the code files a change touched, and needs each at the bar.
 *   node scripts/mutation-check.ts [--update]
 *     after a full `stryker run`, holds every file to its debt or the bar;
 *     --update writes the debts to lint/mutation-baseline.json instead.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  BASELINE_FILE,
  debtsOf,
  mutatedFiles,
  mutationProblems,
  scoresOf,
  type MutationReport,
} from './mutation-score.ts';

/* v8 ignore start -- the command line: git, Stryker and the disk */
const REPORT = 'reports/mutation/mutation.json';
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));

if (process.argv[1]?.endsWith('mutation-check.ts')) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--changed');
  const base = at >= 0 ? args[at + 1] : undefined;
  let changed = new Set<string>();
  if (base) {
    // The pull request's merge commit against its base, as diff-coverage.ts compares them.
    const names = execFileSync('git', ['diff', '--name-only', '--diff-filter=d', base, 'HEAD'])
      .toString()
      .split('\n');
    changed = new Set(mutatedFiles(names).filter((file) => existsSync(file)));
    if (changed.size === 0) {
      console.log('Mutation testing: no code in src/, scripts/ or lint/ changed.');
      process.exit(0);
    }
    execFileSync('npx', ['stryker', 'run', '--mutate', [...changed].join(',')], {
      stdio: 'inherit',
    });
  }
  const scores = scoresOf(readJson(REPORT) as MutationReport);
  if (args.includes('--update')) {
    writeFileSync(BASELINE_FILE, `${JSON.stringify(debtsOf(scores), null, 2)}\n`);
    console.log(`Wrote ${BASELINE_FILE}.`);
    process.exit(0);
  }
  const debts = existsSync(BASELINE_FILE)
    ? (readJson(BASELINE_FILE) as Record<string, number>)
    : {};
  const held = base ? new Map([...scores].filter(([file]) => changed.has(file))) : scores;
  const problems = mutationProblems(held, debts, changed);
  for (const problem of problems) console.error(problem);
  if (problems.length) {
    console.error('Add tests that catch these changes, or say beside one no test can catch why.');
    process.exit(1);
  }
  console.log(`Mutation testing: ${String(held.size)} files at their bar.`);
}
/* v8 ignore stop */
