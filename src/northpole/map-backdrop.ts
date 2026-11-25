/**
 * The layers of a frame behind and in front of what stands on the island: the
 * sky, the northern lights, the clouds and the mountains with the dusk
 * deepening over them, the island's ground, and, over everything, the front
 * fence, the snowfall and the fade in or out of a room. The scene in between is
 * map-scene.ts.
 */
import { duskAt } from './camera';
import type { MapRun } from './map-state';
import { drawFootprints, drawTrail } from './map-trail';
import { drawClouds } from './sky';
import { drawRipples } from './ground';
import { drawSnowfall } from './sky';
import { drawAurora } from './sky';
import { drawLightPools } from './ground';
import { drawStringLights } from './island';
import { theme } from './theme';

const { colors } = theme;

/** The sky, the northern lights, the clouds and the mountains, and the dusk deepening over them. */
export function drawBackdrop(m: MapRun, width: number, height: number, motion: number) {
  const { ctx, scale } = m;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(m.layers.sky.canvas, 0, 0);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawAurora(ctx, width, motion);
  drawClouds(ctx, width, height, motion);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(m.layers.mountains.canvas, 0, 0);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 0.3 * duskAt(motion);
  ctx.fillStyle = colors.night;
  ctx.fillRect(0, 0, width, height);
  // A level's sky takes on its theme's colour.
  if (m.options.level) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = m.options.level.tint;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.globalAlpha = 1;
}

/** The island's ground in world pixels: its snow and water, the lamps' pools, the footprints and the back lights. */
export function drawGround(m: MapRun, motion: number) {
  const { ctx, groundBox } = m;
  ctx.drawImage(m.layers.ground.canvas, groundBox.x, groundBox.y, groundBox.w, groundBox.h);
  drawRipples(ctx, m.world, motion);
  drawLightPools(ctx, m.world, motion);
  drawFootprints(m);
  drawTrail(m);
  ctx.globalAlpha = 1;
  drawStringLights(ctx, m.island, false, motion);
}

/** The island's front fence and its lights, over what stands behind them. */
export function drawFront(m: MapRun, motion: number) {
  const { ctx, groundBox } = m;
  ctx.drawImage(m.layers.front.canvas, groundBox.x, groundBox.y, groundBox.w, groundBox.h);
  drawStringLights(ctx, m.island, true, motion);
}

/** Snow falling over the whole screen, unless nothing should move. */
export function drawWeather(
  m: MapRun,
  width: number,
  height: number,
  time: number,
  still: boolean,
) {
  m.ctx.setTransform(m.scale, 0, 0, m.scale, 0, 0);
  if (!still) drawSnowfall(m.ctx, width, height, time);
}

/** The fade's black over the view. */
export function darken(ctx: CanvasRenderingContext2D, dark: number, width: number, height: number) {
  if (dark <= 0) return;
  ctx.globalAlpha = dark;
  ctx.fillStyle = colors.night;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}
