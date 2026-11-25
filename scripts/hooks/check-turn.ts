/**
 * Claude Code Stop hook: before an agent says it is done, runs the checks that
 * need the whole project (types, unused code, the tests) and, if one fails,
 * sends the agent back to fix it (exit 2). The second time in a row it lets the
 * agent stop, so a check it can't fix can't trap it; CI still holds the line.
 */
import { spawnSync } from 'node:child_process';
import type { Runner } from './checks-for-file.ts';

export const PROJECT_CHECKS: [string, string[]][] = [
  ['Types', ['tsc', '--noEmit']],
  ['Unused code (Knip)', ['knip']],
  ['Tests', ['vitest', 'run']],
];

/** Why the agent isn't done yet, or undefined when every project check passes. */
export function turnFeedback(alreadyBlocked: boolean, run: Runner): string | undefined {
  if (alreadyBlocked) return undefined;
  const failures = PROJECT_CHECKS.flatMap(([name, args]) => {
    const ran = run('npx', args);
    const output = `${ran.stdout}${ran.stderr}`.trim().slice(-4000);
    return ran.status === 0 ? [] : [`${name}:\n${output}`];
  });
  return failures.length
    ? `Not done yet: these project checks fail.\n\n${failures.join('\n\n')}`
    : undefined;
}

/* v8 ignore start -- the hook's entry point, run by Claude Code */
if (process.argv[1]?.endsWith('check-turn.ts')) {
  const input = JSON.parse(await new Response(process.stdin as never).text());
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const run: Runner = (command, args) => spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  const problem = turnFeedback(Boolean(input.stop_hook_active), run);
  if (problem) {
    console.error(problem);
    process.exit(2);
  }
}
/* v8 ignore stop */
