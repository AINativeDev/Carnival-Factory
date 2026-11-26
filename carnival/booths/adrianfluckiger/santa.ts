/**
 * Santa's big red chair with Santa in it, the "Meet Santa" sign and the lanterns
 * and trees around the clearing: the still part of the scene, drawn at the back.
 */
import { glow, pine, shadow, stringLights } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** Fill `color` for the shape `path` draws. */
function filled(ctx: CanvasRenderingContext2D, color: string, path: () => void) {
  ctx.fillStyle = color;
  ctx.beginPath();
  path();
  ctx.fill();
}

/** The trees at the back of the clearing and the sign, over a warm glow. */
export function drawClearing(ctx: CanvasRenderingContext2D, time: number) {
  glow(ctx, 50, 52, 40, 0.5);
  pine(ctx, 8, 56, 26);
  pine(ctx, 94, 54, 24);
  pine(ctx, 18, 50, 18);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(21, 24, 1.6, 22);
  ctx.fillRect(78, 24, 1.6, 22);
  filled(ctx, colors.cream, () => {
    ctx.roundRect(24, 14, 52, 13, 3);
  });
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.font = canvasFont('title', 'bold').replace('32px', '9px');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Meet Santa', 50, 21);
  stringLights(
    ctx,
    [
      { x: 24, y: 28 },
      { x: 50, y: 31 },
      { x: 76, y: 28 },
    ],
    [colors.berry, colors.gold, colors.aurora],
    time,
  );
}

/** The high-backed chair and Santa seated in it. */
export function drawSanta(ctx: CanvasRenderingContext2D, time: number) {
  shadow(ctx, 50, 72, 30);
  filled(ctx, colors.berry, () => {
    ctx.roundRect(38, 36, 24, 30, 7);
  });
  filled(ctx, colors.cream, () => {
    ctx.arc(50, 36, 12, Math.PI, Math.PI * 2);
  });
  ctx.fillStyle = colors.gold;
  ctx.fillRect(36, 56, 2.4, 14);
  ctx.fillRect(61.6, 56, 2.4, 14);
  filled(ctx, colors.berry, () => {
    ctx.roundRect(37, 62, 26, 9, 3);
  });
  filled(ctx, colors.berry, () => {
    ctx.roundRect(42, 44, 16, 22, 5);
  });
  filled(ctx, colors.ink, () => {
    ctx.rect(42, 58, 16, 1.8);
  });
  filled(ctx, colors.gold, () => {
    ctx.rect(48.4, 57.8, 3.2, 2.2);
  });
  filled(ctx, colors.cream, () => {
    ctx.arc(50, 42, 4.6, 0, Math.PI * 2);
  });
  filled(ctx, colors.cream, () => {
    ctx.ellipse(50, 46.4, 4.4, 3.6, 0, 0, Math.PI * 2);
  });
  filled(ctx, colors.berry, () => {
    ctx.arc(50, 38.6, 5, Math.PI, Math.PI * 2);
  });
  filled(ctx, colors.snow, () => {
    ctx.arc(55.8, 40, 1.2, 0, Math.PI * 2);
  });
  filled(ctx, colors.cream, () => {
    ctx.rect(44.6, 38.4, 10.8, 1.6);
  });
  ctx.fillStyle = colors.berry;
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time / 500);
  ctx.fillRect(46, 42.4, 1.6, 1);
  ctx.fillRect(52.4, 42.4, 1.6, 1);
  ctx.globalAlpha = 1;
}
