/**
 * The town of the North Pole: the town square with its tree and Santa's
 * sleigh, the main path in from the entrance arch, the four avenues and their
 * lanes, the room kept round every plot, and the elves strolling the paths.
 * It's apart from the sights and the forest (`world-sights.ts`) because the
 * town grows with the booths, lane by lane, while the sights only move out.
 */
import { blockBox, type Groundwork } from './groundwork';
import { hash, turn, turnBox, type Box, type Plot, type Stroll } from './world';
import { LANE_LENGTH, laneX, PLAZA } from './world-plots';

/** How far the town reaches: the avenues' ends, and how many lanes each has. */
export interface TownSize {
  avenueEnd: number;
  lanesOut: number;
}

/** The town square, its tree, Santa's sleigh and a lamp at each corner. */
export function layTownSquare(work: Groundwork): void {
  const square = { x: -PLAZA, y: -PLAZA, w: 2 * PLAZA + 1, h: 2 * PLAZA + 1 };
  work.lay(square, 'plaza');
  work.keep(square, 1);
  work.place('town-tree', { x: 0, y: 0, w: 1, h: 1 }, true, 0);
  work.place('sleigh', { x: -2, y: -3, w: 2, h: 1 }, true, 0);
  for (const [x, y] of [
    [-3, -3],
    [3, -3],
    [-3, 3],
    [3, 3],
  ] as const) {
    work.place('lamp', { x, y, w: 1, h: 1 });
  }
}

/**
 * The main path on from the east avenue to the entrance arch at the front of
 * the island, under bunting strung between poles, and the big banner by the
 * town square where it comes in.
 */
export function layMainPath(work: Groundwork, avenueEnd: number, extent: number): void {
  work.lay({ x: avenueEnd + 1, y: -1, w: extent - avenueEnd, h: 3 }, 'path');
  work.keep({ x: avenueEnd + 1, y: -2, w: extent - avenueEnd, h: 5 });
  work.place('arch', { x: extent - 1, y: -2, w: 1, h: 5 }, false, 0);
  for (let x = PLAZA + 2; x < extent - 3; x += 8)
    work.place('bunting', { x, y: -2, w: 1, h: 5 }, false, hash(x, 8));
  work.place('banner', { x: PLAZA + 1, y: -PLAZA - 1, w: 3, h: 1 }, false, 0);
  // What's on next, in the open snow off the town square, where the opening view looks.
  work.place('billboard', { x: PLAZA + 4, y: PLAZA - 1, w: 2, h: 1 }, true, 0);
}

/**
 * The four avenues, each with a bench, a cocoa cart and lamps along its north
 * side, and its lanes, with a fence between neighbouring lanes' plots.
 */
export function layAvenues(work: Groundwork, { avenueEnd, lanesOut }: TownSize): void {
  for (let quarter = 0; quarter < 4; quarter++) {
    const at = (box: Box) => turnBox(box, quarter);
    work.place('bench', at({ x: PLAZA + 5, y: -2, w: 1, h: 1 }));
    work.place('cart', at({ x: PLAZA + 7, y: 2, w: 1, h: 1 }));
    work.lay(at({ x: PLAZA + 1, y: -1, w: avenueEnd - PLAZA, h: 3 }), 'path');
    work.keep(at({ x: PLAZA + 1, y: -2, w: avenueEnd - PLAZA, h: 5 }));
    for (let x = PLAZA + 3; x <= avenueEnd; x += 4)
      work.place('lamp', at({ x, y: -2, w: 1, h: 1 }));

    for (let out = 0; out < lanesOut; out++) {
      const x = laneX(4 * out);
      work.lay(at({ x: x - 1, y: 2, w: 3, h: LANE_LENGTH }), 'path');
      work.keep(at({ x: x - 3, y: 2, w: 7, h: LANE_LENGTH + 1 }));
      for (let y = 3; y < 2 + LANE_LENGTH; y++)
        if (hash(quarter, out, y) < 0.7) work.place('fence', at({ x: x + 4, y, w: 1, h: 1 }));
    }
  }
}

/**
 * Keeps room round every plot and its door, paves an attraction's door, and
 * blocks every plot but the open ones, which stay walkable until claimed.
 */
export function clearPlots(work: Groundwork, plots: readonly Plot[]): void {
  for (const plot of plots) {
    work.keep(plot, plot.kind === 'attraction' || plot.kind === 'platform' ? 1 : 0);
    work.keep({ ...plot.door, w: 1, h: 1 });
    if (plot.kind === 'attraction') work.lay({ ...plot.door, w: 1, h: 1 }, 'path');
    if (plot.kind !== 'open') blockBox(work, plot);
  }
}

/** Elves and visitors strolling up and down the avenues and lanes. */
export function townStrolls({ avenueEnd, lanesOut }: TownSize): Stroll[] {
  const strolls: Stroll[] = [];
  for (let quarter = 0; quarter < 4; quarter++) {
    for (const side of [-1, 1]) {
      strolls.push({
        from: turn({ x: PLAZA + 1, y: side }, quarter),
        to: turn({ x: avenueEnd, y: side }, quarter),
        seed: hash(quarter, side, 4),
      });
    }
    for (let out = 0; out < lanesOut; out++) {
      const x = laneX(4 * out);
      strolls.push({
        from: turn({ x, y: 2 }, quarter),
        to: turn({ x, y: 1 + LANE_LENGTH }, quarter),
        seed: hash(quarter, out, 5),
      });
    }
  }
  return strolls;
}
