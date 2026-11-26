/**
 * The one way a script turns a path it was given, from the command line or a
 * workflow, into one it reads or writes: resolved, and only inside the
 * repository, the runner's temporary folder or the system's. Anything else,
 * such as `../../etc/passwd`, throws before any file is touched.
 */
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

/** The repository's root, which every relative path is read from. */
const ROOT = join(import.meta.dirname, '..');

/** Whether `path` is `base` itself or somewhere inside it. */
const within = (base: string, path: string) => {
  const rest = relative(resolve(base), path);
  return rest === '' || (!rest.startsWith('..') && !isAbsolute(rest));
};

/**
 * `given`, resolved against the repository, if it stays inside one of the
 * allowed folders; throws otherwise. `bases` defaults to the repository, the
 * runner's temporary folder (RUNNER_TEMP) and the system's.
 */
export function safePath(
  given: string,
  bases: readonly string[] = [ROOT, process.env.RUNNER_TEMP ?? tmpdir(), tmpdir()],
): string {
  const path = resolve(ROOT, given);
  if (!bases.some((base) => within(base, path)))
    throw new Error(`Refusing a path outside the repository and the temporary folders: ${given}`);
  return path;
}
