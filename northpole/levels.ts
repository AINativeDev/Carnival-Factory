import disabled from './disabled.json';
import { validateLevel, type NorthPoleLevel } from './level';
import { sandboxedSquare } from './sandbox';
import type { NorthPoleSquare } from './square';

/**
 * Every participant's level: each folder in `carnival/levels/` with a `level.ts`. A
 * level is plain data, checked by `validateLevel` before anything is drawn;
 * its own squares run sandboxed like booths, so the page never runs them.
 */
const files = import.meta.glob<unknown>('../carnival/levels/*/level.ts', {
  eager: true,
  import: 'default',
});
const squareFiles = Object.keys(import.meta.glob('../carnival/levels/*/squares/*/square.ts'));
// A maintainer's kill switch, kept apart from the booths' and the attractions'.
const off = new Set(((disabled.levels ?? []) as string[]).map((login) => login.toLowerCase()));

/** A level at the station: open, with its data and squares, or closed with the reason. */
export interface LevelEntry {
  login: string;
  /** Its name, or its owner's login when it's closed. */
  name: string;
  description: string;
  /** The level, when it passed validation and isn't switched off. */
  level?: NorthPoleLevel;
  /** Its own squares, sandboxed, by id. */
  squares: NorthPoleSquare[];
  /** Why it shows "Closed for repairs", if it does. */
  closed?: string;
}

/** The ids of the squares in each level's `squares/` folder, by login. */
export function squaresByLevel(paths: readonly string[]): Map<string, string[]> {
  const byLevel = new Map<string, string[]>();
  for (const path of [...paths].sort()) {
    const parts = path.split('/');
    const login = parts.at(-4)!;
    byLevel.set(login, [...(byLevel.get(login) ?? []), parts.at(-2)!]);
  }
  return byLevel;
}

const squareIds = squaresByLevel(squareFiles);

/** Every level, sorted by login. A broken one says why in the console, once. */
export const levels: LevelEntry[] = Object.keys(files)
  .sort()
  .map((path): LevelEntry => {
    const login = path.split('/').at(-2)!;
    const value = files[path];
    const ids = squareIds.get(login) ?? [];
    const problems = validateLevel(value, login, ids);
    if (off.has(login)) return { login, name: login, description: '', squares: [], closed: 'off' };
    if (problems.length) {
      console.error(`The level ${login} is closed for repairs: ${problems.join('; ')}`);
      return { login, name: login, description: '', squares: [], closed: problems.join('; ') };
    }
    const level = value as NorthPoleLevel;
    return {
      login,
      name: level.name,
      description: level.description,
      level,
      squares: ids.map((id) => sandboxedSquare('level', id, login)),
    };
  });

export const levelOf = (login: string) => levels.find((entry) => entry.login === login);
