import { GUTTER, layoutMap, PLOT_SIZE, slotAt, type MapLayout } from './layout';
import type { NorthPolePlot } from './plot';
import { canvasFont, theme } from './theme';

const { colors } = theme;

/**
 * Draws one plot into the square at (x, y). The plot paints on `scratch`, a
 * canvas of its own that is reset first, and only its pixels are copied onto
 * the map. Whatever state a plot leaves behind, even when it throws halfway
 * through a save, stays on the scratch canvas, and nothing it draws can spill
 * onto a neighbour, even if it resizes that canvas. A plot that throws, or
 * leaves nothing that can be copied, gets a placeholder instead of breaking
 * the whole map.
 */
export function drawPlot(
  ctx: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  plot: NorthPolePlot,
  x: number,
  y: number,
  size: number,
  time: number,
) {
  // Setting the size resets the scratch canvas: its pixels, transform, clip and styles.
  scratch.width = size;
  scratch.height = size;
  try {
    plot.draw(scratch.getContext('2d')!, size, time);
    // The plot can resize its canvas, so copy exactly its square onto exactly its
    // own square. A canvas it emptied makes drawImage throw, which shows the placeholder.
    ctx.drawImage(scratch, 0, 0, size, size, x, y, size, size);
  } catch (error) {
    console.error(`The plot owned by ${plot.owner} failed to draw`, error);
    ctx.save();
    ctx.fillStyle = colors.surface;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = colors.muted;
    ctx.font = canvasFont('small');
    ctx.textAlign = 'center';
    ctx.fillText('Under construction', x + size / 2, y + size / 2);
    ctx.restore();
  }
}

function drawGround(ctx: CanvasRenderingContext2D, layout: MapLayout) {
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.fillStyle = colors.snow;
  for (const slot of layout.slots) {
    ctx.fillRect(slot.x - 6, slot.y - 6, PLOT_SIZE + 12, PLOT_SIZE + 12);
  }
}

function drawSign(ctx: CanvasRenderingContext2D, plot: NorthPolePlot, x: number, y: number) {
  ctx.fillStyle = colors.night;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(plot.name, x + PLOT_SIZE / 2, y + PLOT_SIZE + 10, PLOT_SIZE + GUTTER - 8);
  ctx.textBaseline = 'alphabetic';
}

export interface MapOptions {
  plots: readonly NorthPolePlot[];
  onOpen(owner: string): void;
}

/** Draws the whole map, animates it, and returns a function that stops it. */
export function startMap(canvas: HTMLCanvasElement, options: MapOptions): () => void {
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  const plots = options.plots;
  let layout = layoutMap(plots.length, 0);
  let frame = 0;

  const resize = () => {
    layout = layoutMap(plots.length, canvas.parentElement?.clientWidth ?? window.innerWidth);
    canvas.width = layout.width;
    canvas.height = layout.height;
  };

  const render = (time: number) => {
    drawGround(ctx, layout);
    for (const slot of layout.slots) {
      const plot = plots[slot.index];
      drawPlot(ctx, scratch, plot, slot.x, slot.y, PLOT_SIZE, time);
      drawSign(ctx, plot, slot.x, slot.y);
    }
    frame = requestAnimationFrame(render);
  };

  const plotAt = (event: MouseEvent) => {
    const box = canvas.getBoundingClientRect();
    const x = ((event.clientX - box.left) * canvas.width) / box.width;
    const y = ((event.clientY - box.top) * canvas.height) / box.height;
    const slot = slotAt(layout, x, y);
    return slot ? plots[slot.index] : undefined;
  };

  const onClick = (event: MouseEvent) => {
    const plot = plotAt(event);
    if (plot) options.onOpen(plot.owner);
  };
  const onMove = (event: MouseEvent) => {
    canvas.style.cursor = plotAt(event) ? 'pointer' : 'default';
  };

  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousemove', onMove);
  frame = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('mousemove', onMove);
  };
}

/** Animates a single plot, large, on its own canvas. Returns a function that stops it. */
export function startPreview(canvas: HTMLCanvasElement, plot: NorthPolePlot, size = 480) {
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  let frame = 0;
  const render = (time: number) => {
    ctx.clearRect(0, 0, size, size);
    drawPlot(ctx, scratch, plot, 0, 0, size, time);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return () => cancelAnimationFrame(frame);
}
