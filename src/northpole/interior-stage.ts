/**
 * The back wall of the room inside a square, where its owner shows it off: the
 * framed stage the square's drawing fills, the pool of light in front of it,
 * the portrait beside it and the sign over it. Kept apart from the room's walls
 * and floor (interior-room.ts) because this is the part that says whose square
 * it is.
 */
import type { Room } from './interior';
import { portrait } from './render';
import { canvasFont, theme } from './theme';
import type { Box } from './world';

const { colors } = theme;

/** How wide a frame's moulding is in `room`. */
const rimOf = (room: Room) => room.width * 0.014;

/** A frame round `box`: a cocoa moulding with a gold edge, two rims wide. */
function frame(ctx: CanvasRenderingContext2D, box: Box, rim: number) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(box.x - rim * 2, box.y - rim * 2, box.w + rim * 4, box.h + rim * 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(box.x - rim, box.y - rim, box.w + rim * 2, box.h + rim * 2);
}

/** The stage's frame, dark inside until the square draws on it, and a light pool on the floor in front. */
export function drawStage(ctx: CanvasRenderingContext2D, room: Room) {
  const { centre, back, front, stage } = room;
  frame(ctx, stage, rimOf(room));
  ctx.fillStyle = colors.night;
  ctx.fillRect(stage.x, stage.y, stage.w, stage.h);
  const pool = ctx.createRadialGradient(centre, back, 0, centre, back, stage.w * 0.7);
  pool.addColorStop(0, colors.glow);
  pool.addColorStop(1, `${colors.glow}00`);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(
    centre,
    back + (front - back) * 0.2,
    stage.w * 0.7,
    (front - back) * 0.4,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Where the portrait hangs on the back wall, left of the stage, or undefined when there's no room for it. */
export function portraitBox(room: Room): Box | undefined {
  const { stage, centre, backHalf } = room;
  const free = stage.x - (centre - backHalf);
  const size = Math.min(free * 0.5, stage.h * 0.28);
  if (size < 16) return undefined;
  return { x: stage.x - free / 2 - size / 2, y: stage.y + stage.h * 0.12, w: size, h: size };
}

/** The North Pole's emblem, radius `r` at (0, 0): a gold star on a red disc. */
function emblem(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const reach = n % 2 ? r * 0.3 : r * 0.72;
    const angle = -Math.PI / 2 + (n * Math.PI) / 5;
    ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * A framed portrait on the wall beside the stage: the owner's avatar for a
 * booth (`by` set), or the North Pole's emblem for an attraction.
 */
export function hangPortrait(
  ctx: CanvasRenderingContext2D,
  room: Room,
  by: string,
  avatar?: CanvasImageSource,
) {
  const hung = portraitBox(room);
  if (!hung) return;
  const r = hung.w / 2;
  frame(ctx, hung, rimOf(room));
  ctx.fillStyle = colors.cream;
  ctx.fillRect(hung.x, hung.y, hung.w, hung.h);
  ctx.save();
  ctx.translate(hung.x + r, hung.y + r);
  if (by) portrait(ctx, r * 0.9, avatar);
  else emblem(ctx, r * 0.9);
  ctx.restore();
}

/** The sign over the stage: the name, and whose it is under it for a booth. */
export function hangSign(ctx: CanvasRenderingContext2D, room: Room, name: string, by: string) {
  const { centre, sign } = room;
  const rim = rimOf(room);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(sign.x - rim, sign.y - rim, sign.w + rim * 2, sign.h + rim * 2);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(sign.x, sign.y, sign.w, sign.h);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Each line is scaled to fit the sign's width and its share of the height.
  const fit = (text: string, font: string, color: string, y: number, tall: number) => {
    ctx.font = font;
    ctx.fillStyle = color;
    const measured = ctx.measureText(text).width || 1;
    const scale = Math.min((sign.w * 0.9) / measured, tall / theme.font.title);
    ctx.save();
    ctx.translate(centre, y);
    ctx.scale(scale, scale);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };
  if (by) {
    fit(name, canvasFont('title', 'bold'), colors.ink, sign.y + sign.h * 0.36, sign.h * 0.5);
    fit(by, canvasFont('title'), colors.berry, sign.y + sign.h * 0.76, sign.h * 0.32);
  } else {
    fit(name, canvasFont('title', 'bold'), colors.ink, sign.y + sign.h / 2, sign.h * 0.6);
  }
  ctx.restore();
}
