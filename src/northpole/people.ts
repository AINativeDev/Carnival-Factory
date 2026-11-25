/**
 * The people and animals walking the map: elves and visitors with their legs
 * swinging, the reindeer in their paddock, and the round portrait of a booth's
 * owner. The map, the construction site, the name boards and the room inside a
 * square all draw people with these.
 */
import { shadow } from './brushes';
import { theme } from './theme';
import { toScreen, type Tile } from './world';

const { colors } = theme;

/** How a person looks: their coat and hat. */
export interface Look {
  coat: string;
  hat: string;
  scale: number;
}

/** An elf or a visitor, walking: their legs swing while `moving`. */
export function drawPerson(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  look: Look,
  facing: number,
  moving: boolean,
  time: number,
) {
  const { x, y } = toScreen(at);
  const step = moving ? Math.sin(time / 90) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(look.scale * (facing < 0 ? -1 : 1), look.scale);
  shadow(ctx, 0, 0, 9);
  ctx.fillStyle = colors.night;
  ctx.fillRect(-4 + step * 2, -10, 3, 10);
  ctx.fillRect(1 - step * 2, -10, 3, 10);
  ctx.fillStyle = look.coat;
  ctx.beginPath();
  ctx.moveTo(-7, -9);
  ctx.lineTo(7, -9);
  ctx.lineTo(4, -26);
  ctx.lineTo(-4, -26);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-6, -14, 12, 2);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(0, -31, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.hat;
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.lineTo(6, -34);
  ctx.lineTo(10, -46);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(-7, -36, 14, 3);
  ctx.beginPath();
  ctx.arc(10, -46, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A reindeer, grazing or wandering in its paddock. */
export function drawReindeer(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  facing: number,
  red: boolean,
  time: number,
) {
  const { x, y } = toScreen(at);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing < 0 ? -1 : 1, 1);
  shadow(ctx, 0, 0, 16);
  const step = Math.sin(time / 200) * 2;
  ctx.fillStyle = colors.cocoa;
  for (const lx of [-10, -5, 6, 11]) ctx.fillRect(lx, -14, 3, 14 + (lx > 0 ? step : -step) / 2);
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.ellipse(0, -18, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(9, -32, 6, 14);
  ctx.beginPath();
  ctx.ellipse(16, -33, 7, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, -37);
  ctx.lineTo(8, -48);
  ctx.lineTo(4, -50);
  ctx.moveTo(9, -45);
  ctx.lineTo(13, -50);
  ctx.moveTo(15, -37);
  ctx.lineTo(16, -49);
  ctx.lineTo(20, -52);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = red ? colors.berry : colors.night;
  ctx.beginPath();
  ctx.arc(23, -32, red ? 3 : 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(-14, -20, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A round portrait of radius `r` at (0, 0), in whatever transform the caller
 * set: the owner's avatar, or an elf's silhouette when there is none.
 */
export function portrait(ctx: CanvasRenderingContext2D, r: number, avatar?: CanvasImageSource) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = colors.pine;
  ctx.fill();
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, -r, -r, r * 2, r * 2);
  } else {
    // The elf: a head, a pointed hat with its tip falling to one side, and shoulders.
    ctx.fillStyle = colors.snowShade;
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.12);
    ctx.lineTo(r * 0.4, -r * 0.12);
    ctx.quadraticCurveTo(r * 0.2, -r * 0.6, r * 0.55, -r * 0.7);
    ctx.quadraticCurveTo(-r * 0.05, -r * 0.75, -r * 0.4, -r * 0.12);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = Math.max(1, r / 6);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}
