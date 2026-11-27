/**
 * The Big Top around the act: the tent's striped back walls with lanterns
 * along their tops, the ring with its striped curb, and the spotlight on the
 * juggler. Kept apart from the cast so attraction.ts stays a list of what
 * stands where.
 */
import { box, drum, glow, iso, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** The ring on the snow: its middle and how far it reaches across and back. */
const RING = { x: 50, y: 70, rx: 30 };

/** The tent's two back walls, in red and white stripes, with lantern lights along their tops. */
export function tentWalls(ctx: CanvasRenderingContext2D, time: number) {
  const panel = 5.5;
  for (let i = 0; i < 8; i++) {
    const [lit, side] = i % 2 ? [colors.snow, colors.snowShade] : [colors.berry, colors.berry];
    box(ctx, -22, -22 + i * panel, 2, panel, 30, lit, side, colors.night);
    box(ctx, -22 + i * panel, -22, panel, 2, 30, lit, side, colors.night);
  }
  const along = Array.from({ length: 9 }, (_, i) => -20 + i * 5.25);
  const bulbs = [colors.lantern, colors.gold];
  stringLights(
    ctx,
    along.map((a) => iso(-20, a, 27)),
    bulbs,
    time,
  );
  stringLights(
    ctx,
    along.map((a) => iso(a, -20, 27)),
    bulbs,
    time,
  );
}

/** The ring: a low curb in red and white stripes with warm sawdust inside. */
export function circusRing(ctx: CanvasRenderingContext2D) {
  drum(ctx, RING.x, RING.y + 4, RING.rx, 3, [colors.berry, colors.snow], 14, 0.1, colors.cream);
  ctx.fillStyle = colors.horizon;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(RING.x, RING.y + 1, RING.rx * 0.8, RING.rx * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The spotlight from the top of the tent onto the juggler, swaying a little. */
export function spotlight(ctx: CanvasRenderingContext2D, time: number) {
  const x = 50 + Math.sin(time / 2_600) * 1.5;
  const y = 74;
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.moveTo(x - 3, 4);
  ctx.lineTo(x + 3, 4);
  ctx.lineTo(x + 15, y);
  ctx.lineTo(x - 15, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  glow(ctx, x, y - 10, 22, 0.6);
}
