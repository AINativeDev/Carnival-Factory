import disabled from './disabled.json';
import { applyKillSwitch, createBoothRegistry, fromFolders, type NorthPoleSquare } from './square';

/**
 * Every participant's booth: each folder in `booths/` whose `booth.ts` has a
 * default export. Vite finds them when it builds, so claiming a booth never
 * touches this file, and booths built at the same time don't clash here.
 */
const booths = import.meta.glob<NorthPoleSquare | undefined>('../booths/*/booth.ts', {
  eager: true,
  import: 'default',
});

export const boothRegistry = createBoothRegistry(
  applyKillSwitch(
    fromFolders(booths),
    // A maintainer's kill switch: logins whose booths show "Closed for repairs".
    disabled.booths,
  ),
);
