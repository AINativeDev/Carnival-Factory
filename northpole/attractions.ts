import disabled from './disabled.json';
import {
  applyKillSwitch,
  createAttractionRegistry,
  fromFolders,
  type NorthPoleSquare,
} from './square';

/**
 * The North Pole's own attractions along the midway: each folder in
 * `attractions/` whose `attraction.ts` has a default export. They belong to the
 * map, not to a participant, so only maintainers change them. Vite finds them
 * when it builds, so adding one never touches this file.
 */
const attractions = import.meta.glob<NorthPoleSquare | undefined>(
  '../attractions/*/attraction.ts',
  { eager: true, import: 'default' },
);

export const attractionRegistry = createAttractionRegistry(
  applyKillSwitch(
    fromFolders(attractions),
    // A maintainer's kill switch, kept apart from the booths' so an attraction
    // id can never switch off a participant with the same login.
    disabled.attractions,
  ),
);
