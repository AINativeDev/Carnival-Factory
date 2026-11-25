/**
 * Where every numbered plot is on the North Pole: attractions in rings round
 * the town square, booths either side of the lanes, and the sleigh station's
 * platforms along the main path. A plot's number always means the same place,
 * so adding a booth never moves an attraction or an existing booth. It's apart
 * from laying the world out, `world-build.ts`, because the plots are the
 * promise the pins in `plots.json` and each booth's `plot.json` rely on.
 */
import { turn, turnBox, type Plot } from './world';

/** Half the town square's width, in tiles. */
export const PLAZA = 3;
/** Where the first lane leaves its avenue, and how far apart the lanes are. */
const FIRST_LANE = 18;
const LANE_STEP = 8;
/** Plots along one lane, half on each side. */
const PLOTS_PER_LANE = 6;
/** How far a lane runs from its avenue, in tiles: four for each row of plots. */
export const LANE_LENGTH = (PLOTS_PER_LANE / 2) * 4;
/** Attractions in one ring round the town square. */
export const ATTRACTIONS_PER_RING = 8;
/** How far apart the sleigh station's platforms are along the main path, in tiles. */
export const PLATFORM_STEP = 3;

/** Where a plot is: its tiles and the door visitors stand at. */
type PlotPlace = Pick<Plot, 'x' | 'y' | 'w' | 'h' | 'door'>;

/** Whether a pin is a plot number at all: a whole number, zero or more. */
const isPlotNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/**
 * Which plot number each square gets. A square pinned in `pinned` keeps its
 * number. The others take the lowest free numbers, in the order given.
 */
export function plotNumbers(
  ids: readonly string[],
  pinned: Readonly<Partial<Record<string, number>>> = {},
): Map<string, number> {
  const numbers = new Map<string, number>();
  const taken = new Set<number>();
  for (const id of ids) {
    const number = pinned[id];
    if (isPlotNumber(number) && !taken.has(number)) {
      numbers.set(id, number);
      taken.add(number);
    }
  }
  let next = 0;
  for (const id of ids) {
    if (numbers.has(id)) continue;
    while (taken.has(next)) next++;
    numbers.set(id, next);
    taken.add(next);
  }
  return numbers;
}

/**
 * The four avenues and their lanes are the same shape turned a quarter at a
 * time. Each function below works out a place in the first quarter, whose
 * avenue runs east from the town square and whose lanes run south off it, and
 * turns it into the quarter it belongs to.
 */

/** Attraction plot `number`: 3 by 3, in rings round the town square. */
export function attractionPlot(number: number): PlotPlace {
  const quarter = number % 4;
  const place = Math.floor(number / 4);
  const column = place % 2;
  const row = Math.floor(place / 2);
  const box = { x: 5 + 5 * column, y: 5 + 5 * row, w: 3, h: 3 };
  return { ...turnBox(box, quarter), door: turn({ x: box.x + 1, y: box.y - 1 }, quarter) };
}

/** Which lane a booth plot is on: lanes fill one quarter after another. */
export const laneOf = (number: number) => Math.floor(number / PLOTS_PER_LANE);
/** How far out along its avenue lane `lane` leaves it. */
export const laneX = (lane: number) => FIRST_LANE + LANE_STEP * Math.floor(lane / 4);

/** Booth plot `number`: 2 by 2, either side of a lane. */
export function boothPlot(number: number): PlotPlace {
  const lane = laneOf(number);
  const quarter = lane % 4;
  const place = number % PLOTS_PER_LANE;
  const right = place % 2;
  const row = Math.floor(place / 2);
  const x = laneX(lane);
  const box = { x: right ? x + 2 : x - 3, y: 3 + 4 * row, w: 2, h: 2 };
  return { ...turnBox(box, quarter), door: turn({ x: right ? x + 1 : x - 1, y: box.y }, quarter) };
}

/**
 * The sleigh station's platform `number`: 2 by 2, along the south side of the
 * main path from the east avenue's end to the entrance, with its door on the path.
 */
export function platformPlot(number: number, avenueEnd: number): PlotPlace {
  const x = avenueEnd + 2 + PLATFORM_STEP * number;
  return { x, y: 2, w: 2, h: 2, door: { x, y: 1 } };
}
