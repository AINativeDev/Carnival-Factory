/**
 * The depot's front gate, the first thing a visitor sees: two posts with a
 * "Parcel Depot" sign between them, a clipboard and a lantern.
 */
import { box, glow, iso } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';
import { type Ctx, ellipse, line, rightShade } from './brush';

const { colors } = theme;

/** The gate's two posts, the sign between them, the clipboard and the lantern. */
export function gate(ctx: Ctx, lantern: number) {
  const left = iso(16, 20);
  const right = iso(16, 4);
  const top = 16;
  for (const gy of [20, 4]) {
    box(ctx, 15, gy - 1, 2, 2, top, colors.wood, colors.wood, colors.cocoa);
    rightShade(ctx, 15, gy - 1, 2, 2, top, 0, 0.25);
    const cap = iso(16, gy, top + 0.4);
    ellipse(ctx, cap.x, cap.y, 1.9, 0.9, colors.snow);
  }
  // The sign over the gate hangs level across the posts.
  const a = iso(16, 20.8, top - 1);
  const b = iso(16, 3.2, top - 1);
  const slope = (b.y - a.y) / (b.x - a.x);
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.transform(1, slope, 0, 1, 0, 0);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(0, -1, b.x - a.x, 5.4);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(0.4, -0.6, b.x - a.x - 0.8, 4.6);
  ctx.fillStyle = colors.cocoa;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.scale(0.17, 0.17);
  ctx.fillText('Parcel Depot', (b.x - a.x) / 2 / 0.17, 1.7 / 0.17, 14.8 / 0.17);
  ctx.restore();
  ctx.restore();
  // A clipboard on the left post, with its paper.
  const board = { x: left.x - 2.2, y: left.y - 11 };
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(board.x, board.y, 3.2, 4.4);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(board.x + 0.4, board.y + 0.7, 2.4, 3.4);
  for (let i = 0; i < 3; i++)
    line(
      ctx,
      colors.ink,
      0.2,
      [board.x + 0.7, board.y + 1.6 + i * 0.9],
      [board.x + 2.5, board.y + 1.6 + i * 0.9],
    );
  ctx.fillStyle = colors.gold;
  ctx.fillRect(board.x + 1, board.y - 0.3, 1.2, 0.8);
  // The lantern on the right post, glowing softly.
  const hook = { x: right.x + 1.2, y: right.y - top + 3 };
  line(ctx, colors.cocoa, 0.5, [hook.x, hook.y], [hook.x + 2.8, hook.y]);
  line(ctx, colors.cocoa, 0.25, [hook.x + 2.8, hook.y], [hook.x + 2.8, hook.y + 1]);
  glow(ctx, hook.x + 2.8, hook.y + 2.6, 8, lantern);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(hook.x + 1.8, hook.y + 1, 2, 0.5);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.6 + 0.4 * lantern;
  ctx.fillRect(hook.x + 2, hook.y + 1.5, 1.6, 2.2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(hook.x + 1.8, hook.y + 3.7, 2, 0.5);
}
