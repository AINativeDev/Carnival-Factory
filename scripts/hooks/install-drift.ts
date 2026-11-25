/**
 * Whether the installed packages match package-lock.json. When main gains a
 * dependency, a checkout that hasn't reinstalled fails the project checks in
 * ways that look like broken code (a missing test environment, a linter run
 * through npx); the Stop hook says so plainly instead.
 */

export interface Lockfile {
  packages: Record<string, { name?: string; version?: string; optional?: boolean }>;
}

/** The packages the lockfile needs that aren't installed at its version; optional ones are skipped. */
export function installDrift(lock: Lockfile, installed: Lockfile | undefined): string[] {
  const have: Partial<Lockfile['packages']> = installed?.packages ?? {};
  const drift: string[] = [];
  for (const [path, wanted] of Object.entries(lock.packages)) {
    if (path === '' || wanted.optional === true) continue;
    const name = path.replace(/^.*node_modules\//, '');
    const got = have[path];
    if (!got) drift.push(`${name} (not installed)`);
    else if (got.version !== wanted.version)
      drift.push(`${name} (${got.version ?? '?'}, needs ${wanted.version ?? '?'})`);
  }
  return drift;
}

/** What the agent is told when the install has drifted, or undefined when it hasn't. */
export function installFeedback(drift: string[]): string | undefined {
  if (drift.length === 0) return undefined;
  const shown =
    drift.slice(0, 10).join(', ') + (drift.length > 10 ? `, and ${drift.length - 10} more` : '');
  return `The installed packages don't match package-lock.json, so the project checks can't be trusted yet. Run npm install, then finish. Out of step: ${shown}.`;
}

/** A lockfile's text, read as one; undefined when it isn't one, so a broken file reads as nothing installed. */
export function parseLockfile(text: string | undefined): Lockfile | undefined {
  if (text === undefined) return undefined;
  try {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== 'object' || !('packages' in data)) return undefined;
    const packages: unknown = data.packages;
    if (!packages || typeof packages !== 'object') return undefined;
    return { packages: packages as Lockfile['packages'] };
  } catch {
    return undefined;
  }
}
