/**
 * Building the North Pole for the squares it has: every square on its numbered
 * plot, the construction sites and open plots, the sleigh station, then the
 * town, the sights and the forest round them, laid in a fixed order. A
 * square's plot comes from its number in `plots.json`, a booth's own
 * `plot.json`, or the next free number (see `plots.ts`), so adding a booth
 * never moves an attraction or an existing booth.
 */
import { startGroundwork } from './groundwork';
import { boothPlotNumbers, placePending, type PlotFile } from './plots';
import type { PendingBooth } from './construction-sites';
import type { Plot, World } from './world';
import {
  ATTRACTIONS_PER_RING,
  attractionPlot,
  boothPlot,
  laneOf,
  laneX,
  PLATFORM_STEP,
  platformPlot,
  plotNumbers,
} from './world-plots';
import { growForest, laySights } from './world-sights';
import {
  clearPlots,
  layAvenues,
  layMainPath,
  layTownSquare,
  townStrolls,
  type TownSize,
} from './world-town';

/** The open plots waiting for a booth, on top of the booths and the sites: there's always at least one. */
export const OPEN_PLOTS = 3;
/** How much forest grows round the edge of the town, inside the island's fence: a thin band, so the carnival fills the island. */
const FOREST = 3;

/** Plot numbers pinned by the maintainers in `plots.json`, so squares stay put. */
export interface PinnedPlots {
  attractions: Record<string, number>;
  booths: Record<string, number>;
}

/** What else decides where booths stand: their own `plot.json`s, and the booths being built. */
export interface WorldExtras {
  /** Each booth's own `plot.json`, by login. */
  files?: Record<string, PlotFile>;
  /** The accepted booth requests not merged yet, from `pending.json`. */
  pending?: readonly PendingBooth[];
  /** The logins with a level, each with a platform at the sleigh station. */
  levels?: readonly string[];
}

/**
 * The squares' plots: attractions, booths, the construction sites on the plots
 * held for them, and the open plots after those. Also how far out the
 * attractions and the booths reach, which sets the size of everything else.
 */
function squarePlots(
  attractionIds: readonly string[],
  boothIds: readonly string[],
  pinned: PinnedPlots,
  extras: WorldExtras,
): { plots: Plot[]; lastAttraction: number; lastBooth: number } {
  const plots: Plot[] = [];
  const attractionNumbers = plotNumbers(attractionIds, pinned.attractions);
  for (const [id, number] of attractionNumbers)
    plots.push({ kind: 'attraction', id, number, ...attractionPlot(number) });
  const boothNumbers = boothPlotNumbers(boothIds, pinned.booths, extras.files);
  const taken = new Set(boothNumbers.values());
  for (const [id, number] of boothNumbers)
    plots.push({ kind: 'booth', id, number, ...boothPlot(number) });
  for (const [id, number] of placePending(extras.pending ?? [], boothNumbers).sites) {
    plots.push({ kind: 'site', id, number, ...boothPlot(number) });
    taken.add(number);
  }
  for (let number = 0, open = 0; open < OPEN_PLOTS; number++) {
    if (taken.has(number)) continue;
    plots.push({ kind: 'open', number, ...boothPlot(number) });
    taken.add(number);
    open++;
  }
  return {
    plots,
    lastAttraction: Math.max(-1, ...attractionNumbers.values()),
    lastBooth: Math.max(...taken),
  };
}

/** Builds the world for these squares, in the order their folders sort. */
export function buildWorld(
  attractionIds: readonly string[],
  boothIds: readonly string[],
  pinned: PinnedPlots = { attractions: {}, booths: {} },
  extras: WorldExtras = {},
): World {
  const { plots, lastAttraction, lastBooth } = squarePlots(attractionIds, boothIds, pinned, extras);
  // Every quarter has as many lanes as its busiest neighbour, at least one.
  const lanesOut = Math.floor(laneOf(lastBooth) / 4) + 1;
  const town: TownSize = { avenueEnd: laneX(4 * (lanesOut - 1)) + 5, lanesOut };
  // The sights sit past the furthest attraction plot in use, which a pin can
  // put past where the attractions alone would reach.
  const attractionRows = Math.max(1, Math.floor(lastAttraction / ATTRACTIONS_PER_RING) + 1);
  const sights = 5 + 5 * attractionRows;

  const work = startGroundwork();
  layTownSquare(work);
  // The sleigh station, one platform for each level, along the main path.
  const levels = extras.levels ?? [];
  levels.forEach((login, number) =>
    plots.push({ kind: 'platform', id: login, number, ...platformPlot(number, town.avenueEnd) }),
  );
  const station = levels.length ? town.avenueEnd + 2 + PLATFORM_STEP * levels.length : 0;
  // The island's edge: the forest round the town, and the fence round that.
  // The sights end 10 tiles past their first row, and the stream runs on into the forest.
  const extent = Math.max(town.avenueEnd, station, sights + 11) + FOREST;

  layMainPath(work, town.avenueEnd, extent);
  layAvenues(work, town);
  clearPlots(work, plots);
  const { pond, paddock } = laySights(work, sights);
  growForest(work, extent, FOREST);

  const { ground, blocked, things } = work;
  const strolls = townStrolls(town);
  const start = { x: extent - 2, y: 0 };
  return { ground, blocked, things, plots, pond, paddock, strolls, extent, start };
}
