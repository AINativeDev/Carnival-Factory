import disabled from '../northpole/disabled.json';
import {
  applyKillSwitch,
  createAttractionRegistry,
  fromFolders,
  type NorthPolePlot,
} from '../northpole/plot';

/**
 * The North Pole's own attractions along the midway: each folder here whose
 * `plot.ts` has a default export. They belong to the map, not to a
 * participant, so only maintainers change them. Vite finds them when it
 * builds, so adding one never touches this file.
 */
const attractions = import.meta.glob<NorthPolePlot | undefined>('./*/plot.ts', {
  eager: true,
  import: 'default',
});

export const attractionRegistry = createAttractionRegistry(
  applyKillSwitch(
    fromFolders(attractions),
    // The same kill switch as the plots': ids listed there show "Closed for repairs".
    disabled,
  ),
);
