import disabled from './disabled.json';
import { sandboxedSquare } from './sandbox';
import { readSpotFile, type SpotFile } from './spots';
import { closeForRepairs, createBoothRegistry, idsFromFolders } from './square';

/**
 * Every participant's booth: each folder in `carnival/booths/` with a `booth.ts`. Vite
 * finds them when it builds, so claiming a booth never touches this file. The
 * page never runs a booth's code: each one runs in a sandboxed frame of its
 * own, and the map draws what it sends back. Not eager, so a booth's code is
 * only in its own chunk, which only its frame loads.
 */
const folders = Object.keys(import.meta.glob('../../carnival/booths/*/booth.ts'));
// A maintainer's kill switch: logins whose booths show "Closed for repairs".
const off = new Set((disabled.booths as string[]).map((login) => login.toLowerCase()));

export const boothRegistry = createBoothRegistry(
  idsFromFolders(folders).map((id) =>
    off.has(id) ? closeForRepairs({ id, name: id }) : sandboxedSquare('booth', id),
  ),
);

/**
 * The valid `spot.json` files among `files`, by the login of the booth folder
 * each sits in: the spot its construction site held, which the factory writes
 * when it builds a new booth.
 */
export function spotFilesByLogin(
  files: Readonly<Record<string, unknown>>,
): Record<string, SpotFile> {
  const valid: Record<string, SpotFile> = {};
  for (const [path, value] of Object.entries(files)) {
    const spot = readSpotFile(value);
    // The file's own folder, the path's second-to-last part, is its booth's login.
    if (spot) valid[path.split('/').slice(-2, -1).join('')] = spot;
  }
  return valid;
}

/** Each booth's own `spot.json`, by login. Only valid ones. */
export const boothSpotFiles: Record<string, SpotFile> = spotFilesByLogin(
  import.meta.glob('../../carnival/booths/*/spot.json', { eager: true, import: 'default' }),
);
