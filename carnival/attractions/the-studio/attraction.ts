import type { NorthPoleSquare } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** How long the ON AIR sign takes to pulse bright and back, in milliseconds. */
export const PULSE = 1_800;

/** How bright the ON AIR sign glows at `time`, from 0.5 to 1. */
export const onAirGlow = (time: number) => 0.75 + Math.sin((time / PULSE) * Math.PI * 2) * 0.25;

/** How far the dish on the roof has turned at `time`, in radians either side of facing the sky. */
export const dishTurn = (time: number) => Math.sin(time / 3_000) * 0.35;

/** The studio building, in scene units. */
export const STUDIO = { gx: -18, gy: -12, w: 32, d: 22, h: 20 };

/** The words on the sign over the door. */
export const SIGN = 'ON AIR';

/** The sign's words, lit red, `height` units tall. */
function signText(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.snow;
  ctx.fillText(SIGN, 0, 0);
  ctx.restore();
}

/**
 * The Recording Studio: the North Pole's own studio, a dark building with a
 * glowing red ON AIR sign over its door, a satellite dish turning on the roof
 * and an antenna sending waves. On the map it takes the sleigh into the level
 * of the same name.
 */
const theStudio: NorthPoleSquare = {
  id: 'the-studio',
  name: 'The Recording Studio',
  description:
    'Take the sleigh to the studio lot, where the podcast is recorded and the videos are made.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'shed', roof: 'surface', trim: 'berry', landmark: 'studio' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 54);
      const { gx, gy, w, d, h } = STUDIO;
      box(ctx, gx, gy, w, d, h, colors.slab, colors.surface, colors.night);
      // The lit door, and the ON AIR sign over it, pulsing.
      const door = iso(gx + w / 2, gy + d, 4.5);
      glow(ctx, door.x, door.y, 10, 0.7);
      ctx.fillStyle = colors.glow;
      ctx.fillRect(door.x - 3, door.y - 4.5, 6, 9);
      const bright = onAirGlow(time);
      const sign = iso(gx + w / 2, gy + d, 14);
      glow(ctx, sign.x, sign.y, 16, bright);
      ctx.fillStyle = colors.berry;
      ctx.globalAlpha = bright;
      ctx.fillRect(sign.x - 11, sign.y - 3.5, 22, 7);
      ctx.globalAlpha = 1;
      signText(ctx, sign.x, sign.y, 5);
      // A soundproofed window on the side.
      const pane = iso(gx + w, gy + d / 2, 12);
      ctx.fillStyle = colors.lantern;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(pane.x - 3, pane.y - 2.5, 6, 5);
      ctx.globalAlpha = 1;
      // The satellite dish on the roof, turning slowly.
      const mount = iso(gx + 8, gy + 8, h);
      ctx.fillStyle = colors.ink;
      ctx.fillRect(mount.x - 0.6, mount.y - 5, 1.2, 5);
      ctx.save();
      ctx.translate(mount.x, mount.y - 7);
      ctx.rotate(dishTurn(time));
      ctx.fillStyle = colors.snowShade;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 3, -0.5, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = colors.ink;
      ctx.fillRect(-0.4, -4, 0.8, 4);
      ctx.restore();
      // The antenna at the back corner, sending waves out.
      const base = iso(gx + w - 4, gy + 3, h);
      const top = iso(gx + w - 4, gy + 3, h + 18);
      ctx.strokeStyle = colors.berry;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.stroke();
      ctx.strokeStyle = colors.aurora;
      for (let n = 1; n <= 3; n++) {
        ctx.globalAlpha = (bright * (4 - n)) / 3;
        ctx.beginPath();
        ctx.arc(top.x, top.y, n * 3, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  },
};

export default theStudio;
