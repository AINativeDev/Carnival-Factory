/**
 * The honours a booth's stall wears on its name board: an Elf Engineer's pin,
 * its pom-pom coloured by tier, and a People's Choice trophy for the top three.
 * Split from render.ts, which draws the stall and says where they go.
 */
import type { BadgeTier } from './badges';
import { theme } from './theme';

const { colors } = theme;

/** The pom-pom of an Elf Engineer's hat, by tier. */
const POM_POMS: Record<BadgeTier | 'none', string> = {
  none: colors.snow,
  bronze: colors.gingerbread,
  silver: colors.snowShade,
  gold: colors.gold,
};

/** An Elf Engineer's pin: a round gold badge with an elf's hat on it, `radius` across from its middle. */
export function drawElfHatPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  tier?: BadgeTier,
) {
  const r = radius;
  ctx.save();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // The hat: a red cone curling to the right, a snowy brim and a pom-pom.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.62, y + r * 0.35);
  ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.95, x + r * 0.5, y - r * 0.55);
  ctx.lineTo(x + r * 0.62, y + r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - r * 0.72, y + r * 0.25, r * 1.44, r * 0.34);
  ctx.fillStyle = POM_POMS[tier ?? 'none'];
  ctx.beginPath();
  ctx.arc(x + r * 0.55, y - r * 0.55, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A trophy's metal, by place. */
const TROPHIES: Record<1 | 2 | 3, string> = {
  1: colors.gold,
  2: colors.snowShade,
  3: colors.gingerbread,
};

/** A People's Choice trophy: a cup with two handles on a stand, `radius` across from its middle. */
export function drawTrophy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  place: 1 | 2 | 3,
) {
  const r = radius;
  ctx.save();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TROPHIES[place];
  ctx.strokeStyle = TROPHIES[place];
  ctx.lineWidth = Math.max(1, r * 0.16);
  // The cup, its handles, the stem and the base.
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y - r * 0.6);
  ctx.lineTo(x + r * 0.55, y - r * 0.6);
  ctx.quadraticCurveTo(x + r * 0.5, y + r * 0.1, x, y + r * 0.15);
  ctx.quadraticCurveTo(x - r * 0.5, y + r * 0.1, x - r * 0.55, y - r * 0.6);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * r * 0.55, y - r * 0.3, r * 0.22, -Math.PI / 2, Math.PI / 2, side < 0);
    ctx.stroke();
  }
  ctx.fillRect(x - r * 0.08, y + r * 0.1, r * 0.16, r * 0.3);
  ctx.fillRect(x - r * 0.35, y + r * 0.4, r * 0.7, r * 0.2);
  ctx.restore();
}
