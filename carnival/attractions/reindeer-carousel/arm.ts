/**
 * The ring arm by the carousel's front left: a striped post on the snow with
 * an arm reaching in, a silver or a gold ring hanging from its tip, and the
 * lamp on the arm that warms as your reindeer comes near and turns mint while
 * a tap reaches the ring. After each pass the next ring slides out along the
 * arm. All in the scene's 0 to 100 units.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { isGold, nearness, offered, passOf, WINDOW, type Grab } from './grab';

const { colors } = theme;

/** The post's foot and the arm's tip, where the ring hangs. */
const POST = { x: 12.5, foot: 68.5, top: 53.5 };
/** Where a ring hangs at the arm's tip: exported so the flying rings start there. */
export const RING = { x: 26, y: 60.5, r: 2.3 };

/**
 * Which ring the arm shows at `turn` and where: `along` from 0 at the tip to
 * 1 back at the post, and how much of it shows. Just after the window, a ring
 * left on the arm fades away and the next one slides out from the post.
 */
export function armRing(grab: Grab, turn: number): { pass: number; along: number; shown: number } {
  const { into } = passOf(turn);
  const pass = offered(turn);
  const after = into - WINDOW * 2;
  if (after >= 0 && after < 0.3 && grab.taken !== pass - 1)
    return { pass: pass - 1, along: 0, shown: 1 - after / 0.3 };
  if (grab.taken === pass) return { pass, along: 0, shown: 0 };
  const out = Math.min(1, Math.max(0, (after - 0.3) / 0.6));
  return { pass, along: after >= 0 ? 1 - out : 0, shown: after >= 0 && after < 0.3 ? 0 : 1 };
}

/** A ring at `x`, `y`: silver, or gold with a warm shine, `scale` times its size. */
export function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gold: boolean,
  scale = 1,
) {
  const r = RING.r * scale;
  if (gold) glow(ctx, x, y, r * 3, 0.7);
  ctx.lineWidth = r * 0.5;
  ctx.strokeStyle = gold ? colors.gold : colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Its shine, catching the light from the upper left.
  ctx.lineWidth = r * 0.2;
  ctx.strokeStyle = gold ? colors.glow : colors.snowLit;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.1, 0, Math.PI * 1.05, Math.PI * 1.55);
  ctx.stroke();
}

/** The post, the arm, its lamp glowing as your reindeer nears, and the ring it holds out. */
export function ringArm(ctx: CanvasRenderingContext2D, grab: Grab, turn: number) {
  const near = grab.mode === 'over' ? 0 : nearness(turn);
  const now = Math.min(1, Math.max(0, (near - 2 / 3) / 0.12));
  ctx.save();
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(POST.x + 1.5, POST.foot, 4, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // A candy-striped post, lit on its left.
  ctx.fillStyle = colors.snow;
  ctx.fillRect(POST.x - 1, POST.top, 2, POST.foot - POST.top);
  ctx.fillStyle = colors.berry;
  for (let y = POST.top + 1; y < POST.foot - 1; y += 3.4) ctx.fillRect(POST.x - 1, y, 2, 1.5);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(POST.x + 0.3, POST.top, 0.7, POST.foot - POST.top);
  ctx.globalAlpha = 1;
  // The arm, brass, reaching in to its tip.
  ctx.fillStyle = colors.gold;
  ctx.fillRect(POST.x - 0.8, POST.top + 0.4, RING.x - POST.x + 1.4, 1.3);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(POST.x - 0.8, POST.top + 1.3, RING.x - POST.x + 1.4, 0.4);
  // The lamp on the arm: warm as your reindeer comes, mint while the ring's in reach.
  const lamp = { x: (RING.x + POST.x) / 2 - 1, y: POST.top - 0.6 };
  glow(ctx, lamp.x, lamp.y, 4 + near * 9, 0.3 + near * 0.9);
  ctx.fillStyle = colors.lantern;
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.aurora;
  ctx.globalAlpha = now;
  ctx.fill();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = colors.aurora;
  ctx.globalAlpha = now * 0.8;
  ctx.beginPath();
  ctx.arc(RING.x, RING.y, RING.r + 1.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // The ring, on a short cord from the tip.
  const held = armRing(grab, turn);
  const x = RING.x + held.along * (POST.x + 1.5 - RING.x);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(x, POST.top + 1.7);
  ctx.lineTo(x, RING.y - RING.r);
  ctx.stroke();
  ctx.globalAlpha = held.shown;
  if (held.shown > 0) ring(ctx, x, RING.y, isGold(grab.seed, held.pass));
  ctx.restore();
}
