/**
 * How much of `npm run check` a pull request needs. One that only changes one
 * booth's folder, or one level's, can't change the map's code, so CI checks
 * that folder: the house rules on it, its format and Markdown, the whole
 * project's types and unused code, its own tests and the tests every square
 * must pass. Anything else runs the full check (docs/adr/0053-square-only-check.md).
 *
 * `git diff --name-only <base> HEAD | node scripts/square-check.ts` prints the
 * scope, or nothing for the full check; `node scripts/square-check.ts run <scope>`
 * runs that scope's commands, stopping at the first that fails.
 */
import { spawnSync } from 'node:child_process';

/** A folder name that can be a GitHub login, in lower case. */
const LOGIN = /^[a-z0-9](?:[a-z0-9-]{0,38})$/;

/** Each kind of square folder, and the tests every square of that kind must pass. */
const KINDS = {
  booth: {
    folder: 'booths',
    tests: [
      'src/northpole/booths.test.ts',
      'scripts/square-code.test.ts',
      'scripts/square-size.test.ts',
      'scripts/square-lint-reach.test.ts',
    ],
  },
  level: {
    folder: 'levels',
    tests: [
      'src/northpole/level.test.ts',
      'src/northpole/levels.test.ts',
      'scripts/square-code.test.ts',
      'scripts/square-size.test.ts',
      'scripts/square-lint-reach.test.ts',
    ],
  },
} as const;
type Kind = keyof typeof KINDS;

/** `booth/<login>` or `level/<login>` when every changed file is inside that one folder. */
export function checkScope(files: readonly string[]): string | undefined {
  const changed = files.map((file) => file.trim()).filter(Boolean);
  const scopes = new Set<string>();
  for (const file of changed) {
    const [top, folder, login, ...rest] = file.split('/');
    const kind = (Object.keys(KINDS) as Kind[]).find((k) => KINDS[k].folder === folder);
    if (top !== 'carnival' || !kind || !login || !LOGIN.test(login) || rest.length === 0)
      return undefined;
    scopes.add(`${kind}/${login}`);
  }
  return scopes.size === 1 ? [...scopes][0] : undefined;
}

/** What the command prints for `git diff --name-only`'s output: the scope on a line, or nothing. */
export function scopeOutput(changedFiles: string): string {
  const scope = checkScope(changedFiles.split('\n'));
  return scope ? `${scope}\n` : '';
}

/**
 * The commands that check one square's folder. ESLint gets the repository's
 * config by name, so a config file inside the folder can't switch the house
 * rules off for it.
 */
export function checkCommands(scope: string): string[][] {
  const [kind, login, ...rest] = scope.split('/');
  const known = kind === 'booth' || kind === 'level' ? KINDS[kind] : undefined;
  if (!known || !login || !LOGIN.test(login) || rest.length > 0)
    throw new Error(`Not one booth's or level's folder: ${scope}`);
  const folder = `carnival/${known.folder}/${login}`;
  return [
    ['npx', 'eslint', '--config', 'eslint.config.js', '--pass-on-unpruned-suppressions', folder],
    ['npx', 'markdownlint-cli2', `${folder}/**/*.md`],
    ['node', 'scripts/check-json.ts'],
    ['npx', 'knip'],
    ['npx', 'prettier', '--check', folder],
    ['npx', 'tsc', '--noEmit'],
    ['node', 'scripts/strict-types.ts'],
    ['npx', 'vitest', 'run', folder, ...known.tests],
  ];
}

/* v8 ignore start -- the command-line entry point, run by CI: reading stdin or running commands */
if (process.argv[1]?.endsWith('square-check.ts')) {
  if (process.argv[2] === 'run') {
    for (const [command = '', ...args] of checkCommands(process.argv[3] ?? '')) {
      console.log(`\n$ ${[command, ...args].join(' ')}`);
      const { status } = spawnSync(command, args, { stdio: 'inherit' });
      if (status !== 0) process.exit(status ?? 1);
    }
  } else {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => {
      process.stdout.write(scopeOutput(Buffer.concat(chunks).toString('utf8')));
    });
  }
}
/* v8 ignore stop */
