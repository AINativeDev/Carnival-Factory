/**
 * Claude Code Stop hook: before an agent says it is done, runs the checks that
 * need the whole project (types, unused code, the tests) and, if one fails,
 * sends the agent back to fix it (exit 2). The second time in a row it lets the
 * agent stop, so a check it can't fix can't trap it; CI still holds the line.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { installDrift, installFeedback, parseLockfile } from './install-drift.ts';
import type { Runner } from './checks-for-file.ts';

export const PROJECT_CHECKS: [string, string[]][] = [
  ['Types', ['tsc', '--noEmit']],
  ['Unused code (Knip)', ['knip']],
  ['Tests', ['vitest', 'run']],
];

/** The squares a working tree changes, from `git status --porcelain`. */
export function touchedSquares(porcelain: string): string[] {
  const folders = new Set<string>();
  for (const line of porcelain.split('\n')) {
    const path = line.slice(3).split(' -> ').at(-1) ?? '';
    const square = path.match(
      /^carnival\/(?:booths|attractions)\/[^/]+|^carnival\/levels\/[^/]+\/squares\/[^/]+/,
    );
    if (square) folders.add(square[0]);
  }
  return [...folders].sort();
}

/**
 * Why the agent isn't done yet, or undefined when every project check passes
 * and every square it changed meets the craft conventions (docs/adr/0029).
 */
export function turnFeedback(
  alreadyBlocked: boolean,
  run: Runner,
  installProblem?: string,
): string | undefined {
  if (alreadyBlocked) return undefined;
  // A stale install fails the checks for reasons that aren't the code's: say that alone.
  if (installProblem) return installProblem;
  const failures = PROJECT_CHECKS.flatMap(([name, args]) => {
    const ran = run('npx', args);
    const output = `${ran.stdout}${ran.stderr}`.trim().slice(-4000);
    return ran.status === 0 ? [] : [`${name}:\n${output}`];
  });
  const squares = touchedSquares(run('git', ['status', '--porcelain']).stdout);
  if (squares.length) {
    const craft = run('node', ['scripts/craft/check-square.ts', ...squares]);
    if (craft.status !== 0)
      failures.push(`Craft of the squares you changed:\n${craft.stdout.trim()}`);
  }
  return failures.length
    ? `Not done yet: these project checks fail.\n\n${failures.join('\n\n')}`
    : undefined;
}

/* v8 ignore start -- the hook's entry point, run by Claude Code */
if (process.argv[1]?.endsWith('check-turn.ts')) {
  const input = JSON.parse(await new Response(process.stdin as never).text());
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const run: Runner = (command, args) => spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  const lockfile = (path: string) =>
    parseLockfile(
      existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : undefined,
    );
  const wanted = lockfile('package-lock.json');
  const drift = wanted ? installDrift(wanted, lockfile('node_modules/.package-lock.json')) : [];
  const problem = turnFeedback(Boolean(input.stop_hook_active), run, installFeedback(drift));
  if (problem) {
    console.error(problem);
    process.exit(2);
  }
}
/* v8 ignore stop */
