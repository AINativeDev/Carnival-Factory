/**
 * What sits in a square: one of the North Pole's own attractions, a
 * participant's plot, or an open spot waiting for someone to claim it.
 */
export type SlotKind = 'attraction' | 'plot' | 'open';

/**
 * Where a square sits on the map, in pixels from the map's top-left corner.
 * `index` is the attraction's or plot's place in its own list, and counts the
 * open spots from 0 too.
 */
export interface PlotSlot {
  kind: SlotKind;
  index: number;
  x: number;
  y: number;
}

export interface MapLayout {
  slots: PlotSlot[];
  /** The midway path that runs down the middle of the map. */
  midway: { x: number; width: number };
  width: number;
  height: number;
}

export const PLOT_SIZE = 160;
/** Room around each square for the snow and its sign. */
export const GUTTER = 48;
/** The width of the midway path. */
export const MIDWAY = 64;

const STEP = PLOT_SIZE + GUTTER;

/** How many squares fit on each side of the midway in `maxWidth`, at least one. */
export function sidesFor(maxWidth: number): number {
  return Math.max(1, Math.floor((maxWidth - 2 * GUTTER - MIDWAY) / (2 * STEP)));
}

/** A square's place: its row, which side of the midway, and how far out from it. */
interface Spot {
  row: number;
  side: 'left' | 'right';
  out: number;
}

/**
 * The squares beside the midway that plots fill, in order: row by row from
 * the top, nearest the midway first, left before right, skipping the squares
 * the attractions take. The order depends only on the attractions and the
 * width, never on how many plots there are, so a new plot never moves one.
 */
function* plotSpots(sides: number, attractions: number): Generator<Spot> {
  for (let row = 0; ; row++) {
    for (let out = 0; out < sides; out++) {
      for (const side of ['left', 'right'] as const) {
        if (out === 0 && 2 * row + (side === 'left' ? 0 : 1) < attractions) continue;
        yield { row, side, out };
      }
    }
  }
}

/**
 * Lays the map out as a carnival midway: a path down the middle with the
 * attractions in pairs on either edge of it, and participants' plots lined up
 * beside them like booths, then below them once the attractions' rows are
 * full. The rest of the last row, and at least one square, is open for a new
 * plot.
 *
 * Attractions sit in the same squares however many plots there are, and each
 * plot keeps its square when a plot is added after it, so adding a plot never
 * moves anything but the plots that sort after it, by one square.
 */
export function layoutMap(attractions: number, plots: number, maxWidth: number): MapLayout {
  const sides = sidesFor(maxWidth);
  const midwayX = GUTTER + sides * STEP;
  const spotX = ({ side, out }: Spot) =>
    side === 'left' ? midwayX - (out + 1) * STEP : midwayX + MIDWAY + GUTTER + out * STEP;
  const spotY = ({ row }: Spot) => GUTTER + row * STEP;

  const slots: PlotSlot[] = [];
  for (let index = 0; index < attractions; index++) {
    const spot: Spot = { row: Math.floor(index / 2), side: index % 2 ? 'right' : 'left', out: 0 };
    slots.push({ kind: 'attraction', index, x: spotX(spot), y: spotY(spot) });
  }

  // Every plot, then open spots to the end of the last row with anything in it.
  const spots = plotSpots(sides, attractions);
  let rows = Math.ceil(attractions / 2);
  for (let index = 0; ; index++) {
    const spot = spots.next().value as Spot;
    if (index > plots && spot.row >= rows) break;
    const open = index >= plots;
    rows = Math.max(rows, spot.row + 1);
    slots.push({
      kind: open ? 'open' : 'plot',
      index: open ? index - plots : index,
      x: spotX(spot),
      y: spotY(spot),
    });
  }

  return {
    slots,
    midway: { x: midwayX, width: MIDWAY },
    width: 2 * GUTTER + 2 * sides * STEP + MIDWAY,
    height: GUTTER + rows * STEP,
  };
}

/** The slot under a point on the map, if any. */
export function slotAt(layout: MapLayout, x: number, y: number): PlotSlot | undefined {
  return layout.slots.find(
    (slot) => x >= slot.x && x < slot.x + PLOT_SIZE && y >= slot.y && y < slot.y + PLOT_SIZE,
  );
}
