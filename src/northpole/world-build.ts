/**
 * Building the North Pole for the squares it has: every square on its numbered
 * spot, the construction sites and open spots, the sleigh station, then the
 * town, the sights and the forest round them, laid in a fixed order. A
 * square's spot comes from its number in `spots.json`, a booth's own
 * `spot.json`, or the next free number (see `spots.ts`), so adding a booth
 * never moves an attraction or an existing booth.
 */
import { startGroundwork } from './groundwork';
import { boothSpotNumbers, placePending, type SpotFile } from './spots';
import type { PendingBooth } from './construction-sites';
import type { Spot, World } from './world';
import {
  ATTRACTIONS_PER_RING,
  attractionSpot,
  boothSpot,
  laneOf,
  laneX,
  PLATFORM_STEP,
  platformSpot,
  spotNumbers,
} from './world-spots';
import { growForest, laySights } from './world-sights';
import {
  clearSpots,
  layAvenues,
  layMainPath,
  layTownSquare,
  townStrolls,
  type TownSize,
} from './world-town';

/** The open spots waiting for a booth, on top of the booths and the sites: there's always at least one. */
export const OPEN_SPOTS = 3;
/** How much forest grows round the edge of the town, inside the island's fence: a thin band, so the carnival fills the island. */
const FOREST = 3;

/** Spot numbers pinned by the maintainers in `spots.json`, so squares stay put. */
export interface PinnedSpots {
  attractions: Record<string, number>;
  booths: Record<string, number>;
}

/** What else decides where booths stand: their own `spot.json`s, and the booths being built. */
export interface WorldExtras {
  /** Each booth's own `spot.json`, by login. */
  files?: Record<string, SpotFile>;
  /** The accepted booth requests not merged yet, from `pending.json`. */
  pending?: readonly PendingBooth[];
  /** The logins with a level, each with a platform at the sleigh station. */
  levels?: readonly string[];
}

/**
 * The squares' spots: attractions, booths, the construction sites on the spots
 * held for them, and the open spots after those. Also how far out the
 * attractions and the booths reach, which sets the size of everything else.
 */
function squareSpots(
  attractionIds: readonly string[],
  boothIds: readonly string[],
  pinned: PinnedSpots,
  extras: WorldExtras,
): { spots: Spot[]; lastAttraction: number; lastBooth: number } {
  const spots: Spot[] = [];
  const attractionNumbers = spotNumbers(attractionIds, pinned.attractions);
  for (const [id, number] of attractionNumbers)
    spots.push({ kind: 'attraction', id, number, ...attractionSpot(number) });
  const boothNumbers = boothSpotNumbers(boothIds, pinned.booths, extras.files);
  const taken = new Set(boothNumbers.values());
  for (const [id, number] of boothNumbers)
    spots.push({ kind: 'booth', id, number, ...boothSpot(number) });
  for (const [id, number] of placePending(extras.pending ?? [], boothNumbers).sites) {
    spots.push({ kind: 'site', id, number, ...boothSpot(number) });
    taken.add(number);
  }
  for (let number = 0, open = 0; open < OPEN_SPOTS; number++) {
    if (taken.has(number)) continue;
    spots.push({ kind: 'open', number, ...boothSpot(number) });
    taken.add(number);
    open++;
  }
  return {
    spots,
    lastAttraction: Math.max(-1, ...attractionNumbers.values()),
    lastBooth: Math.max(...taken),
  };
}

/** Builds the world for these squares, in the order their folders sort. */
export function buildWorld(
  attractionIds: readonly string[],
  boothIds: readonly string[],
  pinned: PinnedSpots = { attractions: {}, booths: {} },
  extras: WorldExtras = {},
): World {
  const { spots, lastAttraction, lastBooth } = squareSpots(attractionIds, boothIds, pinned, extras);
  // Every quarter has as many lanes as its busiest neighbour, at least one.
  const lanesOut = Math.floor(laneOf(lastBooth) / 4) + 1;
  const town: TownSize = { avenueEnd: laneX(4 * (lanesOut - 1)) + 5, lanesOut };
  // The sights sit past the furthest attraction spot in use, which a pin can
  // put past where the attractions alone would reach.
  const attractionRows = Math.max(1, Math.floor(lastAttraction / ATTRACTIONS_PER_RING) + 1);
  const sights = 5 + 5 * attractionRows;

  const work = startGroundwork();
  layTownSquare(work);
  // The sleigh station, one platform for each level, along the main path.
  const levels = extras.levels ?? [];
  levels.forEach((login, number) =>
    spots.push({ kind: 'platform', id: login, number, ...platformSpot(number, town.avenueEnd) }),
  );
  const station = levels.length ? town.avenueEnd + 2 + PLATFORM_STEP * levels.length : 0;
  // The island's edge: the forest round the town, and the fence round that.
  // The sights end 10 tiles past their first row, and the stream runs on into the forest.
  const extent = Math.max(town.avenueEnd, station, sights + 11) + FOREST;

  layMainPath(work, town.avenueEnd, extent);
  layAvenues(work, town);
  clearSpots(work, spots);
  const { pond, paddock } = laySights(work, sights);
  growForest(work, extent, FOREST);

  const { ground, blocked, things } = work;
  const strolls = townStrolls(town);
  const start = { x: extent - 2, y: 0 };
  return { ground, blocked, things, spots, pond, paddock, strolls, extent, start };
}
