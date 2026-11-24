/** Where a plot sits on the map, in pixels from the map's top-left corner. */
export interface PlotSlot {
  index: number;
  x: number;
  y: number;
}

export interface MapLayout {
  slots: PlotSlot[];
  width: number;
  height: number;
}

export const PLOT_SIZE = 160;
/** Room around each plot for the path and the owner's sign. */
export const GUTTER = 48;

/**
 * Lays `count` plots out in rows, as square as it can while fitting
 * `maxWidth`. Plots keep their order, so a new plot always lands at the end and
 * nobody else's plot moves further than one row.
 */
export function layoutMap(count: number, maxWidth: number): MapLayout {
  const step = PLOT_SIZE + GUTTER;
  const fit = Math.max(1, Math.floor((maxWidth - GUTTER) / step));
  const columns = Math.max(1, Math.min(fit, Math.ceil(Math.sqrt(count))));
  const rows = Math.max(1, Math.ceil(count / columns));

  const slots = Array.from({ length: count }, (_, index) => ({
    index,
    x: GUTTER + (index % columns) * step,
    y: GUTTER + Math.floor(index / columns) * step,
  }));

  return { slots, width: GUTTER + columns * step, height: GUTTER + rows * step };
}

/** The slot under a point on the map, if any. */
export function slotAt(layout: MapLayout, x: number, y: number): PlotSlot | undefined {
  return layout.slots.find(
    (slot) => x >= slot.x && x < slot.x + PLOT_SIZE && y >= slot.y && y < slot.y + PLOT_SIZE,
  );
}
