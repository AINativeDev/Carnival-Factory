/**
 * The way into the carnival: the candy-cane arch over the main path with
 * "North Pole Carnival" across it, the "Season's Greetings" banner by the town
 * square, and the bunting strung over the path.
 */
import { block, bulb, corners, quad, twinkle } from './brushes';
import { band, faceText, onFace, type Face } from './faces';
import { inTurn } from './rounds';
import { canvasFont, theme } from './theme';
import { TILE_H, TILE_W, toScreen, type Box, type Thing } from './world';

const { colors } = theme;

/** Pillars striped like candy canes, `height` tall on a small footprint. */
function candyPillar(ctx: CanvasRenderingContext2D, box: Box, height: number) {
  block(ctx, box, height, colors.snow, colors.snow, colors.snowShade);
  for (let h = 6; h < height; h += 16)
    block(ctx, box, 6, colors.berry, colors.berry, colors.cocoa, h);
}

/** The entrance arch over the main path at the front of the island, "North Pole Carnival" across it. */
export function drawArch(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const tall = 112;
  const beam = 34;
  const near = { x: thing.x + 0.3, y: thing.y + thing.h - 0.4, w: 0.4, h: 0.4 };
  const far = { x: thing.x + 0.3, y: thing.y, w: 0.4, h: 0.4 };
  candyPillar(ctx, far, tall);
  candyPillar(ctx, near, tall);
  const top = { x: thing.x + 0.3, y: thing.y, w: 0.4, h: thing.h - 0.4 + 0.4 };
  block(ctx, top, beam, colors.snow, colors.cocoa, colors.berry, tall);
  const c = corners(top);
  const face: Face = { a: c.bottom, b: c.right, out: { x: TILE_W / 2, y: TILE_H / 2 } };
  ctx.fillStyle = colors.cream;
  band(ctx, face, 0.06, 0.94, tall + 5, tall + beam - 5);
  ctx.fill();
  const width = Math.abs(face.b.x - face.a.x);
  faceText(
    ctx,
    face,
    'North Pole Carnival',
    0.5,
    tall + beam / 2,
    width * 0.82,
    canvasFont('body', 'bold'),
    colors.berry,
  );
  for (let n = 0; n <= 10; n++) {
    const at = onFace(face, n / 10, tall + beam + 2);
    bulb(ctx, at.x, at.y, n % 2 ? colors.lantern : colors.berry, twinkle(time, n));
  }
  ctx.fillStyle = colors.gold;
  const star = onFace(face, 0.5, tall + beam + 16);
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const r = n % 2 ? 4 : 10;
    const a = (n / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(star.x + Math.cos(a) * r, star.y + Math.sin(a) * r);
  }
  ctx.fill();
}

/** The big banner by the town square, strung between two poles. */
export function drawBanner(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const c = corners(thing);
  const face: Face = { a: c.left, b: c.bottom, out: { x: -TILE_W / 2, y: TILE_H / 2 } };
  const tall = 104;
  ctx.fillStyle = colors.cocoa;
  for (const along of [0.04, 0.96]) {
    const foot = onFace(face, along, 0, -0.5);
    ctx.fillRect(foot.x - 2, foot.y - tall - 8, 4, tall + 8);
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.arc(foot.x, foot.y - tall - 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.cocoa;
  }
  const ripple = Math.sin(time / 800) * 2;
  ctx.fillStyle = colors.berry;
  band(ctx, face, 0.06, 0.94, tall - 44 + ripple, tall, -0.5);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  band(ctx, face, 0.06, 0.94, tall - 4, tall, -0.5);
  ctx.fill();
  const width = Math.abs(face.b.x - face.a.x);
  faceText(
    ctx,
    face,
    "Season's Greetings",
    0.5,
    tall - 22,
    width * 0.8,
    canvasFont('body', 'bold'),
    colors.cream,
    -0.5,
  );
}

/** Bunting strung between two poles over the main path, its flags fluttering. */
export function drawBunting(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const a = toScreen({ x: thing.x, y: thing.y });
  const b = toScreen({ x: thing.x, y: thing.y + thing.h - 1 });
  const tall = 78;
  ctx.fillStyle = colors.cocoa;
  for (const p of [a, b]) ctx.fillRect(p.x - 2, p.y - tall, 4, tall);
  const flags = [colors.berry, colors.gold, colors.pine, colors.snow, colors.violet] as const;
  const at = (t: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t - tall + Math.sin(t * Math.PI) * 18,
  });
  ctx.strokeStyle = colors.ink;
  ctx.beginPath();
  for (let n = 0; n <= 12; n++) {
    const p = at(n / 12);
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  for (let n = 0; n < 11; n++) {
    const p = at((n + 0.5) / 11);
    const q = at((n + 1.2) / 11);
    const flutter = Math.sin(time / 300 + n + thing.seed * 9) * 2;
    ctx.fillStyle = inTurn(flags, n);
    quad(ctx, [p, { x: (p.x + q.x) / 2 + flutter, y: (p.y + q.y) / 2 + 13 }, q]);
    ctx.fill();
  }
}
