/**
 * How much of the smoke test a pull request needs. The map-wide tests always
 * run, but playing every square one by one takes minutes. A pull request that
 * only changes one booth's folder can't change any other square, so CI plays
 * just that booth one by one (`SMOKE_ONLY=booth/<login>`). Anything else plays
 * them all.
 *
 * `git diff --name-only <base> HEAD | node scripts/smoke-scope.ts` prints the
 * scope, or nothing for a full run.
 */

/** A folder name that can be a GitHub login, in lower case. */
const LOGIN = /^[a-z0-9](?:[a-z0-9-]{0,38})$/;

/** `booth/<login>` when every changed file is inside that one booth's folder; otherwise undefined. */
export function smokeScope(files: readonly string[]): string | undefined {
  const changed = files.map((file) => file.trim()).filter(Boolean);
  if (changed.length === 0) return undefined;
  const owners = new Set<string>();
  for (const file of changed) {
    const [top, owner, ...rest] = file.split('/');
    if (top !== 'booths' || !owner || rest.length === 0 || !LOGIN.test(owner)) return undefined;
    owners.add(owner);
  }
  return owners.size === 1 ? `booth/${[...owners][0]}` : undefined;
}

if (process.argv[1]?.endsWith('smoke-scope.ts')) {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const scope = smokeScope(Buffer.concat(chunks).toString('utf8').split('\n'));
  if (scope) process.stdout.write(`${scope}\n`);
}
