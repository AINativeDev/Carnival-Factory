/**
 * The hall itself, at dusk: the back wall and its lighting truss, the two
 * banners either side of the screen (the score and the hype meter on the
 * left, the conference's facts on the right), the stage with its footlights,
 * the slow sweep of the stage lights through the haze, and the tickets sign.
 */
import { glow, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { type Area, SIGN } from './buttons';
import { EVENT } from './program';
import { type Game, hypeAt, HYPE_MAX } from './state';
import { words } from './words';

const { colors } = theme;

/** The back wall, its acoustic panels, and the floor the seats stand on. */
export function wall(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, 56);
  sky.addColorStop(0, colors.night);
  sky.addColorStop(1, colors.dusk);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 100, 56);
  ctx.fillStyle = colors.surface;
  ctx.globalAlpha = 0.5;
  for (let x = 1; x < 100; x += 4) ctx.fillRect(x, 4, 0.5, 36);
  ctx.globalAlpha = 1;
  const floor = ctx.createLinearGradient(0, 52, 0, 100);
  floor.addColorStop(0, colors.shadow);
  floor.addColorStop(1, colors.night);
  ctx.fillStyle = floor;
  ctx.fillRect(0, 52, 100, 48);
  // The truss the lights hang from.
  ctx.fillStyle = colors.ink;
  ctx.fillRect(0, 1, 100, 2.4);
  ctx.strokeStyle = colors.mountain;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (let x = 0; x < 100; x += 2.4) {
    ctx.moveTo(x, 1.2);
    ctx.lineTo(x + 1.2, 3.2);
    ctx.lineTo(x + 2.4, 1.2);
  }
  ctx.stroke();
}

/** A banner hanging from the truss: violet at the top, a mint stripe down its edge. */
function banner(ctx: CanvasRenderingContext2D, area: Area) {
  ctx.fillStyle = colors.surface;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.fillStyle = colors.violet;
  ctx.fillRect(area.x, area.y, area.w, 3);
  ctx.fillStyle = colors.mint;
  ctx.fillRect(area.x + area.w - 0.8, area.y + 3, 0.8, area.h - 3);
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.moveTo(area.x, area.y + area.h);
  ctx.lineTo(area.x + area.w / 2, area.y + area.h + 1.5);
  ctx.lineTo(area.x + area.w, area.y + area.h);
  ctx.fill();
}

/** The hype meter's colour: berry when it's low, gold in the middle, mint when the room is buzzing. */
export const hypeColor = (hype: number) =>
  hype < 30 ? colors.berry : hype < 60 ? colors.gold : colors.mint;

/** The left banner: the score, the best of the visit and the hype meter. */
export function scoreBanner(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const area = { x: 2, y: 6, w: 15, h: 30 };
  banner(ctx, area);
  const mid = area.x + area.w / 2 - 0.4;
  words(ctx, EVENT.title, mid, area.y + 1.6, { size: 2.1, color: colors.snowLit, max: 13 });
  words(ctx, 'SCORE', mid, area.y + 6.5, { size: 2, color: colors.muted });
  const playing = game.mode !== 'demo';
  words(ctx, playing ? String(game.score) : '–', mid, area.y + 11, {
    size: 5,
    color: colors.text,
    max: 13,
  });
  words(ctx, `BEST ${String(game.best)}`, mid, area.y + 16, { size: 2.2, color: colors.gold });
  words(ctx, 'HYPE', mid, area.y + 21, { size: 2, color: colors.muted });
  const hype = hypeAt(game, time);
  ctx.fillStyle = colors.night;
  ctx.fillRect(area.x + 1.5, area.y + 23.5, 11.4, 3);
  ctx.fillStyle = hypeColor(hype);
  ctx.fillRect(area.x + 1.9, area.y + 23.9, (10.6 * hype) / HYPE_MAX, 2.2);
}

/** The right banner: where and when the conference is next. */
export function factsBanner(ctx: CanvasRenderingContext2D) {
  const area = { x: 81, y: 6, w: 16, h: 29.5 };
  banner(ctx, area);
  const mid = area.x + area.w / 2 - 0.4;
  words(ctx, EVENT.title, mid, area.y + 1.6, { size: 2.2, color: colors.snowLit, max: 14 });
  words(ctx, 'Next in', mid, area.y + 7.5, { size: 2.2, color: colors.muted, max: 14 });
  words(ctx, 'London', mid, area.y + 11.5, { size: 3.4, color: colors.mint, max: 14 });
  words(ctx, '7–8 June', mid, area.y + 17.5, { size: 2.8, color: colors.text, max: 14 });
  words(ctx, '2027', mid, area.y + 21.5, { size: 2.8, color: colors.text, max: 14 });
  words(ctx, EVENT.place, mid, area.y + 26.5, { size: 2.4, color: colors.gold, max: 14 });
}

/** The stage: its boards, its front and the warm footlights along its edge. */
export function stage(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.moveTo(8, 40);
  ctx.lineTo(92, 40);
  ctx.lineTo(100, 48);
  ctx.lineTo(0, 48);
  ctx.fill();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.25;
  for (const y of [42, 44.2, 46.4]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(100, y);
    ctx.stroke();
  }
  ctx.fillStyle = colors.ink;
  ctx.fillRect(0, 48, 100, 6);
  const bulbs = Array.from({ length: 21 }, (_, n) => ({ x: 2 + n * 4.8, y: 48.6 }));
  stringLights(ctx, bulbs, [colors.lantern], time);
  words(ctx, 'Tap the AI questions · skip the off-topic ones', 50, 51.6, {
    size: 2.3,
    color: colors.snowLit,
    max: 70,
  });
}

/** The stage lights from the truss, sweeping slowly through the haze. */
export function beams(ctx: CanvasRenderingContext2D, time: number) {
  const lamps = [
    { x: 6, colour: colors.lantern },
    { x: 22, colour: colors.violet },
    { x: 78, colour: colors.mint },
    { x: 94, colour: colors.lantern },
  ];
  lamps.forEach((lamp, n) => {
    const aim = (lamp.x < 50 ? 40 : 60) + Math.sin(time / 5_200 + n * 1.7) * 14;
    ctx.fillStyle = lamp.colour;
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.moveTo(lamp.x - 0.8, 4);
    ctx.lineTo(lamp.x + 0.8, 4);
    ctx.lineTo(aim + 7, 45);
    ctx.lineTo(aim - 7, 45);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.ellipse(aim, 45, 8, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.ink;
    ctx.fillRect(lamp.x - 1.4, 2.6, 2.8, 2.4);
    ctx.fillStyle = colors.glow;
    ctx.fillRect(lamp.x - 1, 4.6, 2, 0.6);
  });
}

/** The tickets sign by the stage, the small way out to the panel's tickets link. */
export function ticketsSign(ctx: CanvasRenderingContext2D, time: number) {
  const { x, y, w, h } = SIGN;
  glow(ctx, x + w / 2, y + h / 2, 9, 0.5 + 0.15 * Math.sin(time / 1_400));
  ctx.fillStyle = colors.mint;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 1.6);
  ctx.fill();
  words(ctx, EVENT.tickets, x + w / 2, y + h / 2, { size: 2.6, color: colors.ink, max: w - 2 });
}
