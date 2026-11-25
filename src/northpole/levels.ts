import disabled from './disabled.json';
import type { NorthPoleLevel } from './level';
import { validateLevel } from './level-check';
import { levelOwner } from './north-pole-levels';
import { sandboxedSquare } from './sandbox';
import type { NorthPoleSquare } from './square';

/**
 * Every participant's level: each folder in `carnival/levels/` with a `level.ts`. A
 * level is plain data, checked by `validateLevel` before anything is drawn;
 * its own squares run sandboxed like booths, so the page never runs them.
 */
const files = import.meta.glob<unknown>('../../carnival/levels/*/level.ts', {
  eager: true,
  import: 'default',
});
const squareFiles = Object.keys(import.meta.glob('../../carnival/levels/*/squares/*/square.ts'));
// A maintainer's kill switch, kept apart from the booths' and the attractions'.
const off = new Set((disabled.levels as string[]).map((login) => login.toLowerCase()));

/** A level at the station: open, with its data and squares, or closed with the reason. */
export interface LevelEntry {
  login: string;
  /** Its name, or its owner's login when it's closed. */
  name: string;
  description: string;
  /** Who it's by, as its panel says it: `@<login>`, or the North Pole for its own levels. */
  owner: string;
  /** The level, when it passed validation and isn't switched off. */
  level?: NorthPoleLevel;
  /** Its own squares, sandboxed, by id. */
  squares: NorthPoleSquare[];
  /** Why it shows "Closed for repairs", if it does. */
  closed?: string;
}

/** The folder `up` levels above a file: 1 is the file's own folder. Empty past the top. */
const folderOf = (path: string, up: number) =>
  path
    .split('/')
    .slice(-up - 1, -up)
    .join('');

/** The ids of the squares in each level's `squares/` folder, by login. */
export function squaresByLevel(paths: readonly string[]): Map<string, string[]> {
  const byLevel = new Map<string, string[]>();
  for (const path of [...paths].sort()) {
    const login = folderOf(path, 3);
    byLevel.set(login, [...(byLevel.get(login) ?? []), folderOf(path, 1)]);
  }
  return byLevel;
}

/**
 * Every level from its `level.ts` files' data, by path, sorted by login: open
 * with its sandboxed squares, or closed, when `off` switched it off or it
 * failed validation. A broken one says why in the console, once.
 */
export function levelEntries(
  files: Readonly<Record<string, unknown>>,
  squarePaths: readonly string[],
  off: ReadonlySet<string>,
): LevelEntry[] {
  const squareIds = squaresByLevel(squarePaths);
  return Object.keys(files)
    .sort()
    .map((path): LevelEntry => {
      const login = folderOf(path, 1);
      const value = files[path];
      const ids = squareIds.get(login) ?? [];
      const closed = (why: string): LevelEntry => ({
        login,
        name: login,
        description: '',
        owner: levelOwner(login),
        squares: [],
        closed: why,
      });
      if (off.has(login)) return closed('off');
      const problems = validateLevel(value, login, ids);
      if (problems.length) {
        console.error(`The level ${login} is closed for repairs: ${problems.join('; ')}`);
        return closed(problems.join('; '));
      }
      const level = value as NorthPoleLevel;
      return {
        login,
        name: level.name,
        description: level.description,
        owner: levelOwner(login),
        level,
        squares: ids.map((id) => sandboxedSquare('level', id, login)),
      };
    });
}

/** Every level on the map, sorted by login. */
export const levels: LevelEntry[] = levelEntries(files, squareFiles, off);

export const levelOf = (login: string) => levels.find((entry) => entry.login === login);
