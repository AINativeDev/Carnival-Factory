/**
 * The studio itself, seen from the front at dusk: a quiet padded wall, string
 * lights along its top, a window onto the snowy hills where the northern lights
 * drift (the scene's one idle motion), and the warm key light falling on the
 * host from the upper left. Everything here is drawn inside the scene's box.
 */
import { glow, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { HEAD, SCENE, WINDOW } from './layout';
import { rounded } from './lettering';

const { colors } = theme;

/** The scene's box as a path, rounded like every panel. */
export function sceneBox(ctx: CanvasRenderingContext2D) {
  rounded(ctx, SCENE.x, SCENE.y, SCENE.w, SCENE.h, 2.2);
}

/** The wall: dusk-dark at the top, warmer low down, with a padded panel behind the host. */
export function wall(ctx: CanvasRenderingContext2D) {
  const bottom = SCENE.y + SCENE.h;
  const paint = ctx.createLinearGradient(0, SCENE.y, 0, bottom);
  paint.addColorStop(0, colors.night);
  paint.addColorStop(0.7, colors.surface);
  paint.addColorStop(1, colors.dusk);
  ctx.fillStyle = paint;
  ctx.fillRect(SCENE.x, SCENE.y, SCENE.w, SCENE.h);
  // One padded panel, its ribs lit on their left like everything in the world.
  const pad = { x: 8, y: 21, w: 32, h: 40 };
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.6;
  rounded(ctx, pad.x, pad.y, pad.w, pad.h, 2.2);
  ctx.fill();
  ctx.fillStyle = colors.mountain;
  ctx.globalAlpha = 0.18;
  for (let x = pad.x + 3; x < pad.x + pad.w - 1; x += 4)
    ctx.fillRect(x, pad.y + 1.5, 0.6, pad.h - 3);
  ctx.globalAlpha = 1;
  const bulbs = [colors.gold, colors.berry, colors.mint, colors.glow];
  const points = Array.from({ length: 13 }, (_, n) => ({
    x: SCENE.x + 3 + n * 7.1,
    y: SCENE.y + 1.6 + Math.sin((n / 12) * Math.PI * 4) ** 2 * 1.4,
  }));
  // A fixed moment, so the bulbs glow steadily: the window's lights are the scene's one idle motion.
  stringLights(ctx, points, bulbs, 0);
}

/** The window high on the wall: the dusk sky, the far hills and the northern lights drifting. */
export function outlook(ctx: CanvasRenderingContext2D, time: number) {
  const { x, y, w, h } = WINDOW;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, x - 1, y - 0.4, w + 2, h + 2, 1.4);
  ctx.fill();
  ctx.fillStyle = colors.wood;
  rounded(ctx, x - 1, y - 1, w + 2, h + 2, 1.4);
  ctx.fill();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, colors.dusk);
  sky.addColorStop(0.6, colors.duskLow);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = colors.aurora;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  for (let i = 0; i <= w; i++) ctx.lineTo(x + i, y + 3.4 + Math.sin(i / 4 + time / 1_600) * 1.4);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.mountain;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (const [px, py] of [
    [0, 8],
    [6, 6],
    [12, 8.5],
    [19, 5],
    [25, 8],
    [31, 6.5],
  ] as const)
    ctx.lineTo(x + px, y + py);
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x, y + h - 1.6, w, 1.6);
  ctx.restore();
  // The cross of the window frame, lit on its left.
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(x + w / 2 - 0.6, y, 1.2, h);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x + w / 2 + 0.2, y, 0.4, h);
}

/** The warm key light, falling from the upper left onto the host and pooling round them. */
export function keyLight(ctx: CanvasRenderingContext2D) {
  const top = SCENE.y;
  const beam = ctx.createLinearGradient(0, top, 0, 62);
  beam.addColorStop(0, colors.lantern);
  beam.addColorStop(1, colors.glow);
  ctx.fillStyle = beam;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.moveTo(SCENE.x, top);
  ctx.lineTo(SCENE.x + 14, top);
  ctx.lineTo(HEAD.x + 20, 62);
  ctx.lineTo(HEAD.x - 16, 62);
  ctx.fill();
  ctx.globalAlpha = 1;
  glow(ctx, HEAD.x + 1, HEAD.y + 2, 19, 0.85);
}
