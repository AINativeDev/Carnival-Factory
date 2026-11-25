/**
 * The Year in Review's older paintings (ADR 0047): the North Pole's
 * attractions as the old masters and the expressionists might have painted
 * them, for the gilded frames of the old masters' wing. Each one paints a
 * canvas 100 by 100 from its top left, which `gallery-art.ts` maps onto a
 * wall. They move only slowly, as a painting can't: a wheel turning, eyes
 * following you round the room.
 */
import { theme } from './theme';

const { colors } = theme;

/** A painting: its canvas is 100 by 100, from its top left. */
export type Painting = (ctx: CanvasRenderingContext2D, time: number) => void;

/** A dark varnished ground, lit warm towards `light`, the way old oils darken round their subject. */
function varnish(ctx: CanvasRenderingContext2D, light: { x: number; y: number }) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = colors.gingerbread;
  for (const [r, alpha] of [
    [60, 0.25],
    [38, 0.3],
    [20, 0.3],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(light.x, light.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Thick swirling strokes across the sky, in turns of gold and ice. */
function swirls(ctx: CanvasRenderingContext2D, turn: number, from: string, to: string) {
  ctx.lineWidth = 5;
  for (let n = 0; n < 6; n++) {
    ctx.strokeStyle = n % 2 ? from : to;
    ctx.beginPath();
    ctx.arc(15 + n * 16, 22 + (n % 3) * 8, 9 + (n % 2) * 5, turn + n, turn + n + 4);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

/** The ferris wheel in a swirling starry night, turning very slowly. */
export const swirlingWheel: Painting = (ctx, time) => {
  ctx.fillStyle = colors.surface;
  ctx.fillRect(0, 0, 100, 100);
  swirls(ctx, time / 9000, colors.gold, colors.ice);
  ctx.fillStyle = colors.pineDark;
  ctx.beginPath();
  ctx.moveTo(10, 100);
  ctx.quadraticCurveTo(16, 40, 22, 100);
  ctx.fill();
  const turn = time / 6000;
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(62, 62, 26, 0, Math.PI * 2);
  for (let n = 0; n < 8; n++) {
    const a = turn + (n * Math.PI) / 4;
    ctx.moveTo(62, 62);
    ctx.lineTo(62 + Math.cos(a) * 26, 62 + Math.sin(a) * 26);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
};

/** The big top as an old master: a red and cream tent glowing out of the dark. */
export const oldBigTop: Painting = (ctx) => {
  varnish(ctx, { x: 50, y: 60 });
  for (let n = 0; n < 6; n++) {
    ctx.fillStyle = n % 2 ? colors.cream : colors.berry;
    ctx.beginPath();
    ctx.moveTo(50, 22);
    ctx.lineTo(20 + n * 10, 84);
    ctx.lineTo(30 + n * 10, 84);
    ctx.fill();
  }
  ctx.fillStyle = colors.gold;
  ctx.fillRect(49, 12, 2, 12);
};

/** The gingerbread house as an expressionist saw it: a crooked house under a writhing sky. */
export const crookedGingerbread: Painting = (ctx, time) => {
  ctx.fillStyle = colors.duskLow;
  ctx.fillRect(0, 0, 100, 100);
  swirls(ctx, time / 12000, colors.horizon, colors.violet);
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.moveTo(24, 90);
  ctx.lineTo(30, 52);
  ctx.lineTo(52, 30);
  ctx.lineTo(78, 56);
  ctx.lineTo(70, 92);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.fillRect(46, 66, 12, 24);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(30, 50, 46, 4);
};

/** A still life of the cocoa hut's mug before the hut's lit window, in old oils. */
export const cocoaStillLife: Painting = (ctx) => {
  varnish(ctx, { x: 36, y: 40 });
  ctx.fillStyle = colors.glow;
  ctx.fillRect(22, 26, 26, 20);
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.ellipse(62, 74, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.fillRect(50, 52, 24, 22);
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(76, 62, 6, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.lineWidth = 1;
};

/** How far a portrait's eyes look to one side at `time`: slowly, from -1 to 1, as if following you. */
export const eyesFollow = (time: number) => Math.sin(time / 3000);

/** A portrait of a stern elf whose eyes are rather too big, and follow you. */
export const staringElf: Painting = (ctx, time) => {
  varnish(ctx, { x: 50, y: 46 });
  ctx.fillStyle = colors.pineDark;
  ctx.beginPath();
  ctx.ellipse(50, 100, 34, 26, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(50, 50, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.moveTo(28, 38);
  ctx.lineTo(72, 38);
  ctx.lineTo(80, 4);
  ctx.fill();
  const look = eyesFollow(time) * 3;
  for (const x of [41, 59]) {
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.arc(x, 50, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(x + look, 51, 4, 0, Math.PI * 2);
    ctx.fill();
  }
};
