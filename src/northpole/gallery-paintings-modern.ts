/**
 * The Year in Review's modern pieces (ADR 0047): the North Pole's
 * attractions as pop art, a modernist poster, colour fields, a grid and a
 * splatter, for the thin black frames of the modern wing. Each paints a canvas
 * 100 by 100 from its top left, like the older paintings beside it.
 */
import type { Painting } from './gallery-paintings-old';
import { inTurn } from './rounds';
import { signFont, theme } from './theme';

const { colors } = theme;

/** A field of halftone dots in `dot` over `ground`, the way pop art prints its colour. */
function halftone(ctx: CanvasRenderingContext2D, ground: string, dot: string) {
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = dot;
  for (let x = 5; x < 100; x += 10)
    for (let y = 5 + (x % 20 === 5 ? 5 : 0); y < 100; y += 10) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
}

/** A comic speech bubble at the top right, saying `words`. */
function bubble(ctx: CanvasRenderingContext2D, words: string) {
  ctx.fillStyle = colors.snow;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(70, 20, 26, 14, 0, 0, Math.PI * 2);
  ctx.moveTo(58, 31);
  ctx.lineTo(50, 44);
  ctx.lineTo(66, 33);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.ink;
  ctx.font = signFont('rounded', 13);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(words, 70, 21);
}

/** The carousel as a pop art panel: a horse in bold outline over dots, shouting WHEE! */
export const popCarousel: Painting = (ctx, time) => {
  halftone(ctx, colors.gold, colors.berry);
  const bob = Math.sin(time / 1500) * 3;
  ctx.fillStyle = colors.snow;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(34, 66 + bob, 20, 11, 0, 0, Math.PI * 2);
  ctx.moveTo(48, 60 + bob);
  ctx.lineTo(56, 42 + bob);
  ctx.lineTo(64, 48 + bob);
  ctx.lineTo(54, 64 + bob);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(34, 20);
  ctx.lineTo(34, 100);
  ctx.stroke();
  ctx.lineWidth = 1;
  bubble(ctx, 'WHEE!');
};

/** The studio as pop art: a microphone over mint dots, saying ON AIR. */
export const popStudio: Painting = (ctx) => {
  halftone(ctx, colors.violet, colors.mint);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(28, 54, 6, 40);
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(31, 46, 13, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  bubble(ctx, 'ON AIR');
};

/** The Factory's tower as a modernist poster: flat colour, one tall shape, a circle and its name. */
export const towerPoster: Painting = (ctx) => {
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(64, 34, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.fillRect(36, 18, 16, 66);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(36, 30, 16, 4);
  ctx.fillStyle = colors.ink;
  ctx.font = signFont('condensed', 16);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TESSL', 50, 92);
};

/** The ice rink as soft colour fields: ice over dusk on a violet ground, breathing a little. */
export const rinkColourField: Painting = (ctx, time) => {
  ctx.fillStyle = colors.violet;
  ctx.fillRect(0, 0, 100, 100);
  ctx.globalAlpha = 0.85 + 0.15 * Math.sin(time / 4000);
  ctx.fillStyle = colors.ice;
  ctx.fillRect(10, 10, 80, 44);
  ctx.fillStyle = colors.dusk;
  ctx.fillRect(10, 60, 80, 30);
  ctx.globalAlpha = 1;
};

/** The schoolhouse as a grid of black lines and blocks of colour, its roof one red triangle. */
export const schoolGrid: Painting = (ctx) => {
  ctx.fillStyle = colors.snow;
  ctx.fillRect(0, 0, 100, 100);
  const blocks: [number, number, number, number, string][] = [
    [0, 0, 40, 34, colors.berry],
    [70, 60, 30, 40, colors.ice],
    [0, 80, 24, 20, colors.gold],
  ];
  for (const [x, y, w, h, color] of blocks) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = colors.ink;
  for (const x of [40, 70]) ctx.fillRect(x - 2, 0, 4, 100);
  for (const y of [34, 60, 80]) ctx.fillRect(0, y - 2, 100, 4);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(44, 56);
  ctx.lineTo(55, 40);
  ctx.lineTo(66, 56);
  ctx.fill();
};

/** Where each splash of the splatter lands: the same every time. */
const SPLASHES = Array.from({ length: 14 }, (_, n) => ({
  x: (n * 37) % 100,
  y: (n * 53 + 11) % 100,
  r: 3 + ((n * 7) % 6),
}));

/** The coaster as a splatter: drips of colour, and its track zig-zagging through them. */
export const coasterSplatter: Painting = (ctx) => {
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, 100, 100);
  const paints = [colors.berry, colors.gold, colors.violet, colors.ink] as const;
  for (const [n, { x, y, r }] of SPLASHES.entries()) {
    ctx.fillStyle = inTurn(paints, n);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 0.8, y, 1.6, r * 2);
  }
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, 80);
  for (const [n, y] of [30, 70, 20, 60, 40].entries()) ctx.lineTo(20 + n * 19, y);
  ctx.stroke();
  ctx.lineWidth = 1;
};
