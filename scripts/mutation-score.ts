/**
 * Mutation scores and their bar (docs/adr/0061-mutation-testing.md). Stryker
 * changes the code one small way at a time; a test that then fails catches
 * the change. A file's score is the share of its changes the tests catch, on
 * the code the tests run: coverage already holds the rest. A new or changed
 * file needs `BAR`. A file that predates the bar is frozen at its debt, `100 -
 * score`, in `lint/mutation-baseline.json`, which only shrinks
 * (scripts/baselines-shrink.ts), like the strict-types baseline.
 */

/** The share of its mutants a new or changed file's tests must catch, in percent. */
export const BAR = 90;

/** The file of each older file's debt: how far below 100 its score may stay. */
export const BASELINE_FILE = 'lint/mutation-baseline.json';

/** Stryker's report, as its JSON reporter writes it: each file's mutants and what became of them. */
export interface MutationReport {
  files: Record<string, { mutants: readonly { status: string }[] }>;
}

/** Statuses that mean the tests caught the change. */
const CAUGHT = new Set(['Killed', 'Timeout']);

/** Each file's score on covered code, in percent to one decimal; a file with no covered mutants has none. */
export function scoresOf(report: MutationReport): Map<string, number> {
  const scores = new Map<string, number>();
  for (const [file, { mutants }] of Object.entries(report.files)) {
    const caught = mutants.filter((mutant) => CAUGHT.has(mutant.status)).length;
    const counted = caught + mutants.filter((mutant) => mutant.status === 'Survived').length;
    if (counted > 0) scores.set(file, Math.round((1000 * caught) / counted) / 10);
  }
  return scores;
}

/** The debts to freeze: every file below the bar, with how far below 100 it is. */
export function debtsOf(scores: ReadonlyMap<string, number>): Record<string, number> {
  const debts: Record<string, number> = {};
  for (const [file, score] of [...scores].sort(([a], [b]) => a.localeCompare(b)))
    if (score < BAR) debts[file] = Math.round((100 - score) * 10) / 10;
  return debts;
}

/**
 * What falls short: a new or changed file under the bar, or any other file
 * under the score its debt allows (the bar, when it has none).
 */
export function mutationProblems(
  scores: ReadonlyMap<string, number>,
  debts: Readonly<Record<string, number>>,
  changed: ReadonlySet<string>,
): string[] {
  return [...scores].flatMap(([file, score]) => {
    const debt = changed.has(file) ? undefined : debts[file];
    const needed = debt === undefined ? BAR : Math.round((100 - debt) * 10) / 10;
    if (score >= needed) return [];
    const why = changed.has(file) ? 'a new or changed file needs' : 'it needs';
    return [`${file}: the tests catch ${String(score)}% of its mutants; ${why} ${String(needed)}%`];
  });
}

/** The code files a change touched that mutation testing holds: src/, scripts/ and lint/, not tests. */
export function mutatedFiles(names: readonly string[]): string[] {
  return names.filter(
    (name) =>
      /^(src|scripts|lint)\/.+\.ts$/.test(name) &&
      !name.endsWith('.test.ts') &&
      !name.endsWith('.d.ts') &&
      !name.startsWith('src/test-support/') &&
      name !== 'src/northpole/sandbox-fakes.ts' &&
      name !== 'scripts/merge-gate-world.ts',
  );
}
