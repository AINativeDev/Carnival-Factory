/**
 * The little people and animals of Santa's line, each drawn standing on a point
 * of the 0 to 100 diorama: kids in bright coats, the elf and the family dog.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** Coats and hats the children take turns wearing. */
const COATS = [colors.aurora, colors.violet, colors.gold, colors.ice, colors.mint] as const;

/** A fill of `color` for the shape `path` draws. */
export function filled(ctx: CanvasRenderingContext2D, color: string, path: () => void) {
  ctx.fillStyle = color;
  ctx.beginPath();
  path();
  ctx.fill();
}

/**
 * A shadow on (x, y), only while the figure is fully there: `shadow` sets its own
 * alpha, so a fading figure drops it rather than leave it behind, then fades by `alpha`.
 */
function standOn(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) {
  if (alpha >= 1) shadow(ctx, x, y, 7);
  ctx.globalAlpha = alpha;
}

/** A child standing on (x, y), `walk` driving the swing of their legs, `alpha` how solid they are. */
export function drawChild(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
  walk: number,
  alpha = 1,
) {
  const coat = COATS[index % COATS.length] ?? colors.gold;
  const step = Math.sin(walk) * 1.2;
  standOn(ctx, x, y, alpha);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 1.8 + step, y - 3, 1.4, 3);
  ctx.fillRect(x + 0.4 - step, y - 3, 1.4, 3);
  filled(ctx, coat, () => {
    ctx.roundRect(x - 2.6, y - 8.5, 5.2, 6, 1.5);
  });
  filled(ctx, colors.cream, () => {
    ctx.arc(x, y - 10.5, 2.2, 0, Math.PI * 2);
  });
  filled(ctx, colors.berry, () => {
    ctx.arc(x, y - 12, 2.3, Math.PI, Math.PI * 2);
  });
  filled(ctx, colors.snow, () => {
    ctx.arc(x, y - 14.4, 0.8, 0, Math.PI * 2);
  });
  ctx.globalAlpha = 1;
}

/** A child perched on Santa's lap, a little speech bubble of presents above them. */
export function drawChildOnLap(ctx: CanvasRenderingContext2D, x: number, y: number, index: number) {
  drawChild(ctx, x, y + 3, index, 0);
  filled(ctx, colors.cream, () => {
    ctx.ellipse(x - 9, y - 16, 6, 4, 0, 0, Math.PI * 2);
  });
  filled(ctx, colors.berry, () => {
    ctx.rect(x - 11, y - 18, 3.4, 3);
  });
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 9.6, y - 18, 0.6, 3);
}

/** The family dog on (x, y): a brown pup wagging its tail, `alpha` how solid it is. */
export function drawDog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wag: number,
  alpha = 1,
) {
  standOn(ctx, x, y, alpha);
  filled(ctx, colors.gingerbread, () => {
    ctx.ellipse(x, y - 3, 3.6, 2, 0, 0, Math.PI * 2);
  });
  filled(ctx, colors.gingerbread, () => {
    ctx.arc(x + 3.4, y - 5, 1.8, 0, Math.PI * 2);
  });
  filled(ctx, colors.cocoa, () => {
    ctx.ellipse(x + 4.6, y - 6.4, 0.7, 1.3, 0.4, 0, Math.PI * 2);
  });
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - 3.4, y - 3.6);
  ctx.lineTo(x - 5.4, y - 5.4 + Math.sin(wag) * 1.4);
  ctx.stroke();
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 2, y - 1.5, 0.9, 1.5);
  ctx.fillRect(x + 1.6, y - 1.5, 0.9, 1.5);
  ctx.globalAlpha = 1;
}

/** The elf on (x, y), facing right, arms out to lead a child by the hand when `leading`. */
export function drawElf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  leading: boolean,
  walk: number,
) {
  const step = Math.sin(walk) * 1.3;
  shadow(ctx, x, y, 7);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(x - 1.8 + step, y - 3, 1.4, 3);
  ctx.fillRect(x + 0.4 - step, y - 3, 1.4, 3);
  filled(ctx, colors.pine, () => {
    ctx.roundRect(x - 3, y - 9, 6, 6.5, 1.5);
  });
  filled(ctx, colors.gold, () => {
    ctx.rect(x - 3, y - 5.4, 6, 1);
  });
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x - 2.4, y - 7.5);
  ctx.lineTo(x - 4.6, y - (leading ? 6.6 : 4.4));
  ctx.stroke();
  filled(ctx, colors.cream, () => {
    ctx.arc(x, y - 11.4, 2.4, 0, Math.PI * 2);
  });
  filled(ctx, colors.cream, () => {
    ctx.moveTo(x + 2.2, y - 11.6);
    ctx.lineTo(x + 4.4, y - 12.8);
    ctx.lineTo(x + 2.2, y - 10.4);
  });
  filled(ctx, colors.pine, () => {
    ctx.moveTo(x - 2.6, y - 13);
    ctx.lineTo(x + 0.6, y - 19);
    ctx.lineTo(x + 2.8, y - 13);
  });
  filled(ctx, colors.berry, () => {
    ctx.arc(x + 0.6, y - 19, 0.9, 0, Math.PI * 2);
  });
}
