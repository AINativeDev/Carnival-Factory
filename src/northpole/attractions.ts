import disabled from './disabled.json';
import { sandboxedSquare } from './sandbox';
import { closeForRepairs, createAttractionRegistry, idsFromFolders } from './square';

/**
 * The North Pole's own attractions along the midway: each folder in
 * `carnival/attractions/` with an `attraction.ts`. They belong to the map, not to a
 * participant, so only maintainers change them, but they run sandboxed like
 * booths. Vite finds them when it builds, so adding one never touches this file.
 */
const folders = Object.keys(import.meta.glob('../../carnival/attractions/*/attraction.ts'));
// A maintainer's kill switch, kept apart from the booths' so an attraction id
// can never switch off a participant with the same login.
const off = new Set((disabled.attractions as string[]).map((id) => id.toLowerCase()));

export const attractionRegistry = createAttractionRegistry(
  idsFromFolders(folders).map((id) =>
    off.has(id) ? closeForRepairs({ id, name: id }) : sandboxedSquare('attraction', id),
  ),
);
