/**
 * How much of the smoke test a pull request needs. The map-wide tests always
 * run, but playing every square one by one takes minutes. A pull request that
 * only changes one booth's folder can't change any other square, so CI plays
 * just that booth one by one (`SMOKE_ONLY=booth/<login>`). A pull request that
 * only changes one level's folder walks just that level and its squares
 * (`SMOKE_ONLY=level/<login>`, ADR 0043). Anything else plays them all.
 *
 * `git diff --name-only <base> HEAD | node scripts/smoke-scope.ts` prints the
 * scope, or nothing for a full run.
 */

/** A folder name that can be a GitHub login, in lower case. */
const LOGIN = /^[a-z0-9](?:[a-z0-9-]{0,38})$/;

/** The participants' folders a scoped run can play on their own, by the folder they sit in. */
const SCOPES = new Map([
  ['booths', 'booth'],
  ['levels', 'level'],
]);

/**
 * `booth/<login>` or `level/<login>` when every changed file is inside that
 * one booth's or level's folder; otherwise undefined.
 */
export function smokeScope(files: readonly string[]): string | undefined {
  const changed = files.map((file) => file.trim()).filter(Boolean);
  if (changed.length === 0) return undefined;
  const scopes = new Set<string>();
  for (const file of changed) {
    const [top, kind = '', owner, ...rest] = file.split('/');
    const scope = SCOPES.get(kind);
    if (top !== 'carnival' || !scope || !owner || rest.length === 0 || !LOGIN.test(owner))
      return undefined;
    scopes.add(`${scope}/${owner}`);
  }
  return scopes.size === 1 ? [...scopes][0] : undefined;
}

/** What the command prints for `git diff --name-only`'s output: the scope on a line, or nothing. */
export function scopeOutput(changedFiles: string): string {
  const scope = smokeScope(changedFiles.split('\n'));
  return scope ? `${scope}\n` : '';
}

/* v8 ignore start -- the command-line entry point, run by CI: reading stdin, then printing */
if (process.argv[1]?.endsWith('smoke-scope.ts')) {
  const chunks: Buffer[] = [];
  process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
  process.stdin.on('end', () => {
    process.stdout.write(scopeOutput(Buffer.concat(chunks).toString('utf8')));
  });
}
/* v8 ignore stop */
