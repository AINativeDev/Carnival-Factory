/**
 * Drawing one square's own picture into its place, on the map or on its room's
 * stage. Kept apart from the walkable map because it's the one place a square's
 * code meets the map's canvas, and so the one place that must keep a broken
 * square from spilling onto its neighbours.
 */
import type { NorthPoleSquare, SquareKey, SquarePointer } from './square';
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
  pointer?: SquarePointer,
  keys?: readonly SquareKey[],
) {
  // Setting the size resets the scratch canvas: its pixels, transform, clip and styles.
  scratch.width = size;
  scratch.height = size;
  try {
    booth.draw(scratch.getContext('2d') as CanvasRenderingContext2D, size, time, pointer, keys);
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
