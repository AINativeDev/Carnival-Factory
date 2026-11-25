/**
 * Which checks a file gets when an agent writes it, by its kind: the same
 * commands CI runs, one file at a time, so a broken rule reaches the agent on the
 * edit that broke it (docs/adr/0022-lint-everything-on-edit.md).
 */
export interface Check {
  /** What the check is, for the message back to the agent. */
  name: string;
  command: string;
  args: string[];
  /** A local tool that may not be installed; CI runs it from its own image. */
  optional?: boolean;
}

const prettier = (file: string): Check => ({
  name: 'Prettier',
  command: 'npx',
  args: ['prettier', '--check', file],
});

export function checksForFile(file: string): Check[] {
  if (/\.(ts|js|mjs|cjs)$/.test(file)) {
    // Map code drops the lint debt it pays off as it goes; a carnival file never
    // touches the shared suppressions, so a booth's pull request stays in its folder.
    const prune = file.startsWith('carnival/')
      ? '--pass-on-unpruned-suppressions'
      : '--prune-suppressions';
    const checks = [
      { name: 'ESLint', command: 'npx', args: ['eslint', prune, file] },
      prettier(file),
    ];
    if (file.endsWith('.ts'))
      checks.push({ name: 'TypeScript', command: 'node', args: ['scripts/strict-types.ts'] });
    return checks;
  }
  if (file.endsWith('.md'))
    return [
      { name: 'markdownlint', command: 'npx', args: ['markdownlint-cli2', file] },
      prettier(file),
    ];
  if (file.endsWith('.json'))
    return [
      { name: 'JSON', command: 'node', args: ['scripts/check-json.ts', file] },
      prettier(file),
    ];
  if (file.endsWith('.sh'))
    return [{ name: 'ShellCheck', command: 'shellcheck', args: [file], optional: true }];
  if (/^\.github\/workflows\/.+\.ya?ml$/.test(file))
    return [
      { name: 'actionlint', command: 'actionlint', args: [file], optional: true },
      prettier(file),
    ];
  if (/\.(ya?ml|css|html)$/.test(file)) return [prettier(file)];
  return [];
}

/** What running a command gave back: the shape of spawnSync's result that matters here. */
export interface Ran {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}
export type Runner = (command: string, args: string[]) => Ran;

/**
 * Runs each check and gathers what failed, with its output, and notes on
 * optional tools that aren't installed here.
 */
export function runChecks(checks: Check[], file: string, run: Runner) {
  const failures: string[] = [];
  const notes: string[] = [];
  for (const check of checks) {
    const ran = run(check.command, check.args);
    if (ran.error && check.optional) {
      notes.push(`${check.name} isn't installed here, so it didn't check ${file}; CI will.`);
    } else if (ran.status !== 0) {
      failures.push(`${check.name}:\n${ran.stdout}${ran.stderr}`.trim());
    }
  }
  return { failures, notes };
}
