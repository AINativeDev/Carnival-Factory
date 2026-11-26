import { type Ctx, colors } from './brushes';

/**
 * Noir: washes the colour out of everything drawn so far, leaving the street
 * in black and white, before the van goes back on top in its red.
 * `saturation` keeps each pixel's lightness and hue and takes the snow's
 * saturation, which is all but none.
 */
export function drawNoir(ctx: Ctx, size: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = colors.snow;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

/**
 * Chiaroscuro for the night run: the street falls into darkness all round,
 * and the van's headlights throw one pale beam up the road ahead of it, so
 * the van and what it's about to meet are the brightest things in the
 * picture. Drawn after the street and before the snow and the dashboard,
 * which stay as bright as ever.
 */
export function drawLighting(ctx: Ctx, size: number, vanX: number, vanY: number, vanW: number) {
  ctx.save();
  // The darkness: clear round the van and up the road, deepening to the edges.
  const lit = { x: vanX, y: vanY - size * 0.2 };
  const dark = ctx.createRadialGradient(lit.x, lit.y, size * 0.05, lit.x, lit.y, size * 0.62);
  dark.addColorStop(0, 'transparent');
  dark.addColorStop(0.2, 'transparent');
  dark.addColorStop(0.8, colors.night);
  dark.addColorStop(1, colors.night);
  ctx.globalAlpha = 0.93;
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, size, size);
  // The headlights' beam: a warm wedge from the van's nose to the bend ahead.
  const nose = vanY - vanW * 0.35;
  const beam = ctx.createLinearGradient(0, nose, 0, size * 0.38);
  beam.addColorStop(0, colors.snowLit);
  beam.addColorStop(1, 'transparent');
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(vanX - vanW * 0.3, nose);
  ctx.lineTo(vanX + vanW * 0.3, nose);
  ctx.lineTo(vanX + size * 0.16, size * 0.38);
  ctx.lineTo(vanX - size * 0.16, size * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
