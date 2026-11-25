/**
 * Claude Code PostToolUse hook: after an agent writes or edits a file, runs that
 * file's checks and, if any fail, hands their output back to the agent (exit 2),
 * so it fixes the problem now rather than finding it in CI.
 */
import { spawnSync } from 'node:child_process';
import { relative } from 'node:path';
import { checksForFile, runChecks, type Runner } from './checks-for-file.ts';

/** The message for the agent about an edited file, or undefined when it passes. */
export function editFeedback(path: string | undefined, root: string, run: Runner) {
  const file = path ? relative(root, path) : '';
  if (!file || file.startsWith('..') || file.startsWith('node_modules/')) return {};
  const { failures, notes } = runChecks(checksForFile(file), file, run);
  const problem = failures.length
    ? `${file} breaks the repository's rules. Fix it before going on:\n\n${failures.join('\n\n')}`
    : undefined;
  return { problem, notes };
}

/* v8 ignore start -- the hook's entry point, run by Claude Code */
if (process.argv[1]?.endsWith('check-edited-file.ts')) {
  const input = JSON.parse(await new Response(process.stdin as never).text());
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const run: Runner = (command, args) => spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  const { problem, notes } = editFeedback(input.tool_input?.file_path, root, run);
  for (const note of notes ?? []) console.log(note);
  if (problem) {
    console.error(problem);
    process.exit(2);
  }
}
/* v8 ignore stop */
