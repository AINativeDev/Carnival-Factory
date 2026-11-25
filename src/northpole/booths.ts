import disabled from './disabled.json';
import { sandboxedSquare } from './sandbox';
import { readPlotFile, type PlotFile } from './plots';
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
 * The valid `plot.json` files among `files`, by the login of the booth folder
 * each sits in: the plot its construction site held, which the factory writes
 * when it builds a new booth.
 */
export function plotFilesByLogin(
  files: Readonly<Record<string, unknown>>,
): Record<string, PlotFile> {
  const valid: Record<string, PlotFile> = {};
  for (const [path, value] of Object.entries(files)) {
    const plot = readPlotFile(value);
    // The file's own folder, the path's second-to-last part, is its booth's login.
    if (plot) valid[path.split('/').slice(-2, -1).join('')] = plot;
  }
  return valid;
}

/** Each booth's own `plot.json`, by login. Only valid ones. */
export const boothPlotFiles: Record<string, PlotFile> = plotFilesByLogin(
  import.meta.glob('../../carnival/booths/*/plot.json', { eager: true, import: 'default' }),
);
