import disabled from '../northpole/disabled.json';
import {
  applyKillSwitch,
  createPlotRegistry,
  fromFolders,
  type NorthPolePlot,
} from '../northpole/plot';

/**
 * Every plot on the map: each folder here whose `plot.ts` has a default
 * export. Vite finds them when it builds, so claiming a plot never touches
 * this file, and plots built at the same time don't clash here.
 */
const plots = import.meta.glob<NorthPolePlot | undefined>('./*/plot.ts', {
  eager: true,
  import: 'default',
});

export const registry = createPlotRegistry(
  applyKillSwitch(
    fromFolders(plots),
    // A maintainer's kill switch: owners whose plots show "Closed for repairs".
    disabled,
  ),
);
