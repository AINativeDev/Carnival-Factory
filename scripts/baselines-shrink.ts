/**
 * Baselines only shrink (AGENTS.md): code that predates a rule is frozen at its
 * debt in a baseline file, and a change may lower a number or drop an entry,
 * never raise one or add one. The lint rules read those files as their limits,
 * so without this check a pull request could raise a number and pass. CI runs
 * it on every pull request against its base branch.
 *
 * `node scripts/baselines-shrink.ts <base>`, where <base> is a git ref such as
 * origin/main.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/** The baselines, each a JSON file of debts. */
export const BASELINES = ['lint/strict-types-baseline.json', 'eslint-suppressions.json'];

/** Every number in a baseline, keyed by its path in the file, such as `src/a.ts › rule › count`. */
export function debts(value: unknown, path: string[] = []): Map<string, number> {
  const found = new Map<string, number>();
  if (typeof value === 'number') found.set(path.join(' › '), value);
  else if (typeof value === 'object' && value !== null)
    for (const [key, inner] of Object.entries(value))
      for (const [at, n] of debts(inner, [...path, key])) found.set(at, n);
  return found;
}

/** What a change did wrong to a baseline: each debt it added or raised. */
export function grown(before: unknown, after: unknown): string[] {
  const was = debts(before);
  return [...debts(after)].flatMap(([at, n]) => {
    const old = was.get(at);
    if (old === undefined) return [`${at}: added at ${String(n)}`];
    return n > old ? [`${at}: raised from ${String(old)} to ${String(n)}`] : [];
  });
}

/** How the check reads a baseline: as it is now (undefined when gone), and as it was at the base (undefined when new). */
export interface Baselines {
  now(file: string): unknown;
  atBase(file: string): unknown;
}

/** Every debt added or raised across the baselines, as lines to print. */
export function problems(read: Baselines): string[] {
  return BASELINES.flatMap((file) => {
    const after = read.now(file);
    if (after === undefined) return [];
    const before = read.atBase(file);
    if (before === undefined) return [`${file}: a new baseline`];
    return grown(before, after).map((problem) => `${file}: ${problem}`);
  });
}

/* v8 ignore start -- the command line: reading git and the disk, then exiting. */
function fromGit(base: string): Baselines {
  return {
    now: (file) =>
      existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as unknown) : undefined,
    atBase: (file) => {
      try {
        return JSON.parse(
          execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' }),
        ) as unknown;
      } catch {
        return undefined;
      }
    },
  };
}

if (process.argv[1]?.endsWith('baselines-shrink.ts')) {
  const found = problems(fromGit(process.argv[2] ?? 'origin/main'));
  for (const problem of found) console.error(problem);
  if (found.length) {
    console.error('Baselines only shrink: fix the code instead of raising its debt.');
    process.exit(1);
  }
  console.log('Baselines: nothing added or raised.');
}
/* v8 ignore stop */
