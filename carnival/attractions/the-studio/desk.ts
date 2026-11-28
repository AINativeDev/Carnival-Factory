/**
 * The studio's furniture, front-on and lit from the upper left: the desk the
 * host sits at, with its lit top, its front fading from light to shade and a
 * cool shadow to the lower right; the faders and the level meter on it; the
 * speaker on the right that thumps as the take plays back; and the floor.
 */
import { theme } from '../../../src/northpole/theme';
import { DESK, LANE, SCENE } from './layout';
import { rounded } from './lettering';

const { colors } = theme;

/** The floor in front of the desk, and the desk's cool shadow on it. */
export function floor(ctx: CanvasRenderingContext2D) {
  const bottom = SCENE.y + SCENE.h;
  const paint = ctx.createLinearGradient(0, DESK.front, 0, bottom);
  paint.addColorStop(0, colors.shadow);
  paint.addColorStop(1, colors.night);
  ctx.fillStyle = paint;
  ctx.fillRect(SCENE.x, DESK.front, SCENE.w, bottom - DESK.front);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(DESK.left + 2, DESK.foot);
  ctx.lineTo(DESK.right, DESK.foot);
  ctx.lineTo(DESK.right + 6, DESK.foot + 3.5);
  ctx.lineTo(DESK.left + 8, DESK.foot + 3.5);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The desk across the front: a lit top, and a front from light on the left to shade on the right. */
export function desk(ctx: CanvasRenderingContext2D) {
  const { left, right, top, front, foot } = DESK;
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.moveTo(left + 1.5, top);
  ctx.lineTo(right - 1.5, top);
  ctx.lineTo(right, front);
  ctx.lineTo(left, front);
  ctx.fill();
  const shade = ctx.createLinearGradient(left, 0, right, 0);
  shade.addColorStop(0, colors.wood);
  shade.addColorStop(1, colors.cocoa);
  ctx.fillStyle = shade;
  ctx.fillRect(left, front, right - left, foot - front);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(left, front, right - left, 0.4);
  ctx.globalAlpha = 1;
}

/** The faders and the level meter on the desk, the meter lit up to `level` from 0 to 1. */
export function mixer(ctx: CanvasRenderingContext2D, level: number) {
  const y = DESK.top - 4.6;
  ctx.fillStyle = colors.ink;
  rounded(ctx, 45, y, 17, 5, 1);
  ctx.fill();
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(45, y + 0.4, 0.5, 4.2);
  for (let n = 0; n < 5; n++) {
    const x = 48 + n * 3;
    ctx.fillStyle = colors.night;
    ctx.fillRect(x, y + 1, 0.6, 3);
    ctx.fillStyle = n === 2 ? colors.berry : colors.snowShade;
    ctx.fillRect(x - 0.7, y + 1.2 + ((n * 7) % 5) * 0.45, 2, 0.9);
  }
  ctx.fillStyle = colors.ink;
  rounded(ctx, 64, y, 13, 5, 1);
  ctx.fill();
  for (let n = 0; n < 6; n++) {
    ctx.fillStyle = n < 3 ? colors.mint : n < 5 ? colors.gold : colors.berry;
    ctx.globalAlpha = n / 6 < level ? 1 : 0.18;
    ctx.fillRect(65.6 + n * 1.85, y + 1, 1.2, 3);
  }
  ctx.globalAlpha = 1;
}

/** The speaker standing on the right, its cones swelling by `beat` from 0 to 1. */
export function speaker(ctx: CanvasRenderingContext2D, beat: number) {
  const box = { x: 83, y: LANE.y + LANE.half + 3.5, w: 10, h: 20 };
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.45;
  ctx.fillRect(box.x + 2, box.y + box.h - 0.5, box.w + 1, 2.2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.ink;
  rounded(ctx, box.x, box.y, box.w, box.h, 1.2);
  ctx.fill();
  ctx.fillStyle = colors.mountain;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(box.x, box.y + 1, 0.8, box.h - 2);
  ctx.globalAlpha = 1;
  const cx = box.x + box.w / 2;
  for (const [y, r] of [
    [box.y + 5, 2.2],
    [box.y + 13, 3.6],
  ] as const) {
    const swell = r * (1 + beat * 0.12);
    ctx.fillStyle = colors.night;
    ctx.beginPath();
    ctx.arc(cx, y, swell, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.mountain;
    ctx.beginPath();
    ctx.arc(cx - 0.3, y - 0.3, swell * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}
