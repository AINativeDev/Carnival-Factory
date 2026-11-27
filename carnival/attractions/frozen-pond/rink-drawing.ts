/**
 * Drawing what moves on Frozen Pond's ice: the skaters, the curling stones,
 * the dotted aim line of a drag, and the sweeper's broom. All in the
 * attraction's 0 to 100 units, as `scene` scales them.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { HACK, STONE, onScreen, type Point, type Stone } from './sheet';
import { slideLength, type Throw } from './stones';

const { colors } = theme;

/** A skater standing at (x, y) in a scarf, its arms up in a cheer while `cheer` is above 0. */
export function drawSkater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scarf: string,
  cheer = 0,
) {
  shadow(ctx, x, y + cheer * 2, 6);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x - 1.8, y - 7.2, 3.6, 7.2);
  ctx.fillStyle = scarf;
  ctx.fillRect(x - 2.2, y - 7.6, 4.4, 1.4);
  if (cheer > 0) {
    ctx.strokeStyle = colors.surface;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x - 1.6, y - 6.6);
    ctx.lineTo(x - 3.2, y - 10);
    ctx.moveTo(x + 1.6, y - 6.6);
    ctx.lineTo(x + 3.2, y - 10);
    ctx.stroke();
  }
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y - 9.4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = scarf;
  ctx.beginPath();
  ctx.arc(x, y - 10.3, 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.muted;
  ctx.fillRect(x - 2.1, y, 4.2, 0.7);
}

/** A curling stone with its middle at (x, y) on screen: granite, its top gold for yours and berry for a rival's. */
function drawStone(ctx: CanvasRenderingContext2D, at: Point, rival: boolean, fade = 1) {
  const rx = STONE * 1.15;
  const ry = rx / 2;
  ctx.globalAlpha = fade;
  shadow(ctx, at.x + 0.4, at.y + 0.3, rx * 2.4);
  ctx.globalAlpha = fade;
  ctx.fillStyle = colors.mountain;
  ctx.beginPath();
  ctx.ellipse(at.x, at.y, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(at.x - rx, at.y - 1.1);
  ctx.ellipse(at.x, at.y - 1.1, rx, ry, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = rival ? colors.berry : colors.gold;
  ctx.beginPath();
  ctx.ellipse(at.x, at.y - 1.1, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = fade * 0.55;
  ctx.beginPath();
  ctx.ellipse(at.x - rx * 0.35, at.y - 1.3, rx * 0.35, ry * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = fade;
  ctx.fillStyle = colors.ink;
  ctx.fillRect(at.x - 0.8, at.y - 1.9, 1.6, 0.6);
  ctx.globalAlpha = 1;
}

/** Every stone on the sheet, the farther ones first, those gone out of play fading away. */
export function drawStones(ctx: CanvasRenderingContext2D, stones: readonly Stone[], time: number) {
  const order = [...stones].sort((a, b) => a.w - b.w);
  for (const stone of order) {
    const fade = stone.out === Infinity ? 1 : Math.max(0, 1 - (time - stone.out) / 700);
    drawStone(ctx, onScreen(stone.s, stone.w), stone.rival, fade);
  }
}

/**
 * The stone waiting at the hack, drawn back a little with the drag, and the
 * dotted line of where the throw would stop on still air: gold within reach of
 * the house, berry once it would slide past the back line.
 */
export function drawAim(ctx: CanvasRenderingContext2D, thrown: Throw | undefined, time: number) {
  const hack = onScreen(HACK, 0);
  const pull = thrown ? thrown.power * 3 : 0;
  const tilt = thrown ? Math.sin(thrown.angle) * pull : 0;
  drawStone(ctx, { x: hack.x - pull * Math.cos(thrown?.angle ?? 0), y: hack.y - tilt / 2 }, false);
  if (!thrown) return;
  const length = slideLength(thrown.power);
  const steps = Math.max(2, Math.floor(length / 2.2));
  const reach = HACK + length * Math.cos(thrown.angle);
  ctx.fillStyle = reach > 67 ? colors.berry : colors.gold;
  for (let n = 1; n <= steps; n++) {
    const along = ((n - ((time / 400) % 1)) / steps) * length;
    if (along <= 0) continue;
    const at = onScreen(HACK + along * Math.cos(thrown.angle), along * Math.sin(thrown.angle));
    ctx.beginPath();
    ctx.ellipse(at.x, at.y - 1, 0.45, 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const end = onScreen(reach, length * Math.sin(thrown.angle));
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(end.x, end.y, STONE * 1.3, STONE * 0.65, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** The sweeper skating beside the stone at (x, y), its broom brushing the ice ahead while `brushing` lasts. */
export function drawSweeper(
  ctx: CanvasRenderingContext2D,
  at: Point,
  brushing: number,
  time: number,
) {
  const x = at.x + 2.5;
  const y = at.y - 3.2;
  drawSkater(ctx, x, y, colors.mint);
  const sweep = Math.sin(time / 45) * 1.4 * brushing;
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 5);
  ctx.lineTo(at.x + 4 + sweep, at.y + 0.4);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.fillRect(at.x + 2.9 + sweep, at.y + 0.1, 2.2, 0.8);
  if (brushing <= 0) return;
  ctx.globalAlpha = 0.5 * brushing;
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.ellipse(at.x + 5, at.y + 0.5, 3, 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
