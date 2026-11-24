import disabled from '../northpole/disabled.json';
import { applyKillSwitch, createPlotRegistry, type NorthPolePlot } from '../northpole/plot';

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
    Object.keys(plots)
      .sort()
      .map((path) => {
        const plot = plots[path];
        if (!plot) throw new Error(`${path} needs a default export of its NorthPolePlot`);
        const folder = path.split('/')[1];
        if (plot.owner !== folder) {
          throw new Error(`${path} exports a plot owned by "${plot.owner}", not "${folder}"`);
        }
        return plot;
      }),
    // A maintainer's kill switch: owners whose plots show "Closed for repairs".
    disabled,
  ),
);
