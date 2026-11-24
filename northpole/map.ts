import { GUTTER, layoutMap, SQUARE_SIZE, slotAt, type MapLayout, type Slot } from './layout';
import type { NorthPoleSquare } from './square';
import { canvasFont, theme } from './theme';

const { colors } = theme;

/**
 * Draws one booth into the square at (x, y). The booth paints on `scratch`, a
 * canvas of its own that is reset first, and only its pixels are copied onto
 * the map. Whatever state a booth leaves behind, even when it throws halfway
 * through a save, stays on the scratch canvas, and nothing it draws can spill
 * onto a neighbour, even if it resizes that canvas. A booth that throws, or
 * leaves nothing that can be copied, gets a placeholder instead of breaking
 * the whole map.
 */
export function drawSquare(
  ctx: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  booth: NorthPoleSquare,
  x: number,
  y: number,
  size: number,
  time: number,
) {
  // Setting the size resets the scratch canvas: its pixels, transform, clip and styles.
  scratch.width = size;
  scratch.height = size;
  try {
    booth.draw(scratch.getContext('2d')!, size, time);
    // The booth can resize its canvas, so copy exactly its square onto exactly its
    // own square. A canvas it emptied makes drawImage throw, which shows the placeholder.
    ctx.drawImage(scratch, 0, 0, size, size, x, y, size, size);
  } catch (error) {
    console.error(`The square ${booth.id} failed to draw`, error);
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
    ctx.fillRect(slot.x - 6, slot.y - 6, SQUARE_SIZE + 12, SQUARE_SIZE + 12);
  }
}

/** The midway: a trodden path down the middle, with a string of twinkling lights on each edge. */
function drawMidway(ctx: CanvasRenderingContext2D, layout: MapLayout, time: number) {
  const { x, width } = layout.midway;
  ctx.fillStyle = colors.ice;
  ctx.fillRect(x, 0, width, layout.height);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x + width * 0.15, 0, width * 0.7, layout.height);

  const spacing = 24;
  for (let y = spacing / 2, n = 0; y < layout.height; y += spacing, n++) {
    for (const edge of [x + 4, x + width - 4]) {
      const on = Math.sin(time / 400 + n * 1.7 + edge) > -0.3;
      ctx.globalAlpha = on ? 1 : 0.35;
      ctx.fillStyle = n % 2 ? colors.gold : colors.berry;
      ctx.beginPath();
      ctx.arc(edge, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** An open spot: a staked-out square of fresh snow, waiting for a booth. */
function drawOpenSpot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x + 4, y + 4, SQUARE_SIZE - 8, SQUARE_SIZE - 8);
  ctx.restore();
  ctx.fillStyle = colors.muted;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'center';
  ctx.fillText('+', x + SQUARE_SIZE / 2, y + SQUARE_SIZE / 2);
}

/** The sign under a square: its name, and whose it is. */
function drawSign(ctx: CanvasRenderingContext2D, name: string, by: string, x: number, y: number) {
  const width = SQUARE_SIZE + GUTTER - 8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.night;
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText(name, x + SQUARE_SIZE / 2, y + SQUARE_SIZE + 8, width);
  ctx.fillStyle = colors.surface;
  ctx.font = canvasFont('small');
  ctx.fillText(by, x + SQUARE_SIZE / 2, y + SQUARE_SIZE + 24, width);
  ctx.textBaseline = 'alphabetic';
}

export type SquareKind = 'attraction' | 'booth';

export interface MapOptions {
  /** The North Pole's own attractions, along the midway. */
  attractions: readonly NorthPoleSquare[];
  /** Participants' booths, beside them. */
  booths: readonly NorthPoleSquare[];
  /** Opens a square: `id` is a booth's owner or an attraction's id. */
  onOpen(kind: SquareKind, id: string): void;
}

/** Draws the whole map, animates it, and returns a function that stops it. */
export function startMap(canvas: HTMLCanvasElement, options: MapOptions): () => void {
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  const { attractions, booths } = options;
  const squareAt = (slot: Slot) =>
    slot.kind === 'attraction'
      ? attractions[slot.index]
      : slot.kind === 'booth'
        ? booths[slot.index]
        : undefined;
  let layout = layoutMap(attractions.length, booths.length, 0);
  let frame = 0;

  const resize = () => {
    layout = layoutMap(
      attractions.length,
      booths.length,
      canvas.parentElement?.clientWidth ?? window.innerWidth,
    );
    canvas.width = layout.width;
    canvas.height = layout.height;
  };

  const render = (time: number) => {
    drawGround(ctx, layout);
    drawMidway(ctx, layout, time);
    for (const slot of layout.slots) {
      const square = squareAt(slot);
      if (!square) {
        drawOpenSpot(ctx, slot.x, slot.y);
        drawSign(ctx, 'Open booth', 'Claim it', slot.x, slot.y);
        continue;
      }
      drawSquare(ctx, scratch, square, slot.x, slot.y, SQUARE_SIZE, time);
      const by = slot.kind === 'attraction' ? 'North Pole' : `@${square.id}`;
      drawSign(ctx, square.name, by, slot.x, slot.y);
    }
    frame = requestAnimationFrame(render);
  };

  const slotUnder = (event: MouseEvent) => {
    const box = canvas.getBoundingClientRect();
    const x = ((event.clientX - box.left) * canvas.width) / box.width;
    const y = ((event.clientY - box.top) * canvas.height) / box.height;
    const slot = slotAt(layout, x, y);
    return slot && slot.kind !== 'open' ? slot : undefined;
  };

  const onClick = (event: MouseEvent) => {
    const slot = slotUnder(event);
    const square = slot && squareAt(slot);
    if (slot && square) options.onOpen(slot.kind as SquareKind, square.id);
  };
  const onMove = (event: MouseEvent) => {
    canvas.style.cursor = slotUnder(event) ? 'pointer' : 'default';
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

/** Animates a single booth or attraction, large, on its own canvas. Returns a function that stops it. */
export function startPreview(canvas: HTMLCanvasElement, booth: NorthPoleSquare, size = 480) {
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  let frame = 0;
  const render = (time: number) => {
    ctx.clearRect(0, 0, size, size);
    drawSquare(ctx, scratch, booth, 0, 0, size, time);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return () => cancelAnimationFrame(frame);
}
