/**
 * Which squares get a history (scripts/square-history.ts): every booth,
 * attraction and level folder in carnival/ that holds its file, so a level's
 * history is read as a booth's is.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { HistoryKind } from './square-history.ts';

/** The kinds of square with a history: each a folder `carnival/<kind>s/<id>/` holding `<kind>.ts`. */
const HISTORY_KINDS: readonly HistoryKind[] = ['booth', 'attraction', 'level'];

/** Every square in the repository at `root`, as `<kind>/<id>`. */
export function squaresOnDisk(root: string): string[] {
  return HISTORY_KINDS.flatMap((kind) => {
    const folder = join(root, 'carnival', `${kind}s`);
    return readdirSync(folder)
      .filter((id) => existsSync(join(folder, id, `${kind}.ts`)))
      .map((id) => `${kind}/${id}`);
  });
}
