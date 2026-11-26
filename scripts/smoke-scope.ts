/**
 * How much of the smoke test a pull request needs. A pull request that only
 * changes one booth's folder can't change any other square or the site, so CI
 * plays just that booth, in the specs in `BOOTH_ONLY_SPECS`
 * (`SMOKE_ONLY=booth/<login>`). A pull request that only changes one level's
 * folder still runs the whole suite, since the map reads a level's data
 * itself, but walks just that level and its squares one by one
 * (`SMOKE_ONLY=level/<login>`, ADR 0043). Anything else runs the whole suite.
 *
 * `git diff --name-only <base> HEAD | node scripts/smoke-scope.ts` prints the
 * scope, or nothing for a full run.
 */

/**
 * The smoke specs a booth-only run needs: playing the booth (its screenshot,
 * which the risk check judges, its frame budget, and the map with it on) and
 * its flashing check. A booth runs sandboxed and can't change the map, the
 * menu, the levels or any page, so the rest of the suite would test code the
 * pull request didn't touch (docs/adr/0051-booth-only-smoke.md).
 */
export const BOOTH_ONLY_SPECS = /(?:^|\/)(?:squares-play|flashing)\.spec\.ts$/;

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

/** Whether a run's `SMOKE_ONLY` scope plays a booth alone, in `BOOTH_ONLY_SPECS` and Chromium only (ADR 0051). */
export function boothOnly(scope: string | undefined): boolean {
  return scope?.startsWith('booth/') ?? false;
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
