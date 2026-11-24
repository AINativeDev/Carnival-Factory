import disabled from './disabled.json';
import { sandboxedSquare } from './sandbox';
import { closeForRepairs, createBoothRegistry, idsFromFolders } from './square';

/**
 * Every participant's booth: each folder in `booths/` with a `booth.ts`. Vite
 * finds them when it builds, so claiming a booth never touches this file. The
 * page never runs a booth's code: each one runs in a sandboxed frame of its
 * own, and the map draws what it sends back. Not eager, so a booth's code is
 * only in its own chunk, which only its frame loads.
 */
const folders = Object.keys(import.meta.glob('../booths/*/booth.ts'));
// A maintainer's kill switch: logins whose booths show "Closed for repairs".
const off = new Set((disabled.booths as string[]).map((login) => login.toLowerCase()));

export const boothRegistry = createBoothRegistry(
  idsFromFolders(folders).map((id) =>
    off.has(id) ? closeForRepairs({ id, name: id }) : sandboxedSquare('booth', id),
  ),
);
