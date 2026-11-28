/**
 * The tour's first two scenes on the slab. Why a factory: on the left one
 * agent under a desk lamp piles up pages faster than the person beside it can
 * read them; on the right a small workshop sends parcels down a belt, through
 * two gates that light mint once each is through, to a neat stack of gifts.
 * Skills: four of this repository's own skills as gems on plinths, the agent
 * in the middle following one in turn, its name and what it does on a caption.
 */
import { box, glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { agent, groundAt, person, sign } from './props';
import { gift, words } from './text';
import { SKILL_CARDS } from './tour-copy';
import { easeIn, panel, popIn } from './ui';
import { belt, hut, lamp, ON_BELT } from './works';

const { colors } = theme;

/** How many pages the lone agent has piled up at `time`: growing, then starting over. */
export const pagesAt = (time: number) => 6 + Math.floor((time / 300) % 16);

/** Where a parcel riding down the belt is at `time`, from 0 at the start to 1 at the end. */
export const rideAt = (time: number, lap: number) => (time % lap) / lap;

/** One agent alone: a tall, swaying pile of pages, and a person who would have to read them all. */
function alone(ctx: CanvasRenderingContext2D, time: number) {
  glow(ctx, 30, 60, 16, 0.9);
  const pages = pagesAt(time);
  const sway = Math.sin(time / 420) * 0.05;
  const base = groundAt(22, 68);
  for (let n = 0; n < pages; n++) {
    const lean = sway * n;
    const top = n % 2 ? colors.cream : colors.snowLit;
    box(
      ctx,
      base.gx - 3 + lean,
      base.gy - 3 - lean,
      3,
      3,
      1,
      top,
      colors.snowLit,
      colors.snowShade,
      n * 1.15,
    );
  }
  // A page in flight from the agent onto the pile.
  const t = (time % 300) / 300;
  const pileTop = 63 - 1.15 * pages;
  ctx.fillStyle = colors.cream;
  ctx.fillRect(31 - t * 9, 55 + (pileTop - 55) * t - Math.sin(t * Math.PI) * 5, 2.4, 0.8);
  agent(ctx, 34, 67, time, 1, colors.berry);
  person(ctx, 13, 68, colors.violet);
  words(ctx, '?', 16, 54 + Math.sin(time / 600) * 0.6, 4.4, colors.gold);
}

/** A factory: a workshop sends parcels down a belt, through two gates that light once each is through. */
function checked(ctx: CanvasRenderingContext2D, time: number) {
  glow(ctx, 64, 58, 14, 0.8);
  hut(ctx, 64, 62, 5, 7, colors.berry);
  const lap = 4_200;
  const x = 62 + rideAt(time, lap) * 24;
  belt(ctx, 58, 88, 66, (time / lap) * 24);
  for (const at of [72, 81]) lamp(ctx, at, 64, 7, Math.max(0, Math.min(1, (x - at - 1) / 2.5)));
  glow(ctx, x, 63, 5, 0.6);
  gift(ctx, x, 66 - ON_BELT, 3);
  for (const [gx, gy] of [
    [89, 67],
    [91.5, 67],
    [90.2, 64.6],
  ] as const)
    gift(ctx, gx, gy, 2.4);
  agent(ctx, 70, 72, time, 0.6, colors.mint);
  agent(ctx, 80, 72, time, 0.6, colors.mint);
}

/** Why a factory: one agent alone on the left, a factory on the right, each popping up as the step begins. */
export function whyScene(ctx: CanvasRenderingContext2D, time: number, since: number) {
  sign(ctx, 'ONE AGENT', 24, 33);
  sign(ctx, 'A FACTORY', 74, 33);
  popIn(ctx, 24, 66, since, 0, () => {
    alone(ctx, time);
  });
  popIn(ctx, 74, 66, since, 120, () => {
    checked(ctx, time);
  });
}

/** How long the agent follows each skill, in ms. */
const SKILL_TIME = 2_600;

/** Which skill the agent is following at `time`: each in turn, a moment each. */
export const cardLitAt = (time: number) => Math.floor(time / SKILL_TIME) % SKILL_CARDS.length;

/** Each skill's gem colour, in order. */
const GEMS = [colors.ice, colors.berry, colors.gold, colors.mint] as const;

/** Where each skill's plinth stands: its nearest corner on screen, round the agent. */
const PLINTHS = [
  { x: 19, y: 63 },
  { x: 35, y: 57 },
  { x: 65, y: 57 },
  { x: 81, y: 63 },
] as const;

/** A gem at `x`, `y`, `r` across, in `color`, its right half in shade. */
function gem(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.3);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r * 1.3);
  ctx.lineTo(x - r, y);
  ctx.fill();
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.3);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r * 1.3);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Plinth `n` with its gem, lifted and glowing while the agent follows it, a beam running to the agent. */
function plinth(ctx: CanvasRenderingContext2D, n: number, lit: number, time: number) {
  const at = PLINTHS.at(n) ?? PLINTHS[0];
  const color = GEMS.at(n) ?? colors.ice;
  const { gx, gy } = groundAt(at.x, at.y);
  box(ctx, gx - 4, gy - 4, 4, 4, 4, colors.snowLit, colors.slab, colors.slabShade);
  const on = n === lit;
  const y = at.y - 11 - (on ? 2.5 : 0) + Math.sin(time / 700 + n) * 0.5;
  if (on) {
    glow(ctx, at.x, y, 10, 1);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(at.x, y);
    ctx.lineTo(50, 55);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  gem(ctx, at.x, y, on ? 2 : 1.5, color);
}

/** The caption for the skill being followed: its folder name and what it does, easing in as it changes. */
function caption(ctx: CanvasRenderingContext2D, lit: number, time: number) {
  const card = SKILL_CARDS.at(lit) ?? SKILL_CARDS[0];
  panel(ctx, { x: 10, y: 71.5, w: 80, h: 13 });
  ctx.fillStyle = GEMS.at(lit) ?? colors.ice;
  ctx.fillRect(10, 73.5, 0.8, 9);
  const ease = easeIn(time % SKILL_TIME);
  ctx.globalAlpha = ease;
  words(ctx, card.folder, 15, 75.8 + (1 - ease), 3.6, colors.snow, 'left', 56);
  words(ctx, card.does, 15, 80.6 + (1 - ease), 3, colors.snowLit, 'left', 70);
  ctx.globalAlpha = 1;
  GEMS.forEach((color, n) => {
    ctx.fillStyle = n === lit ? color : colors.muted;
    ctx.globalAlpha = n === lit ? 1 : 0.45;
    ctx.beginPath();
    ctx.arc(75 + n * 3.4, 75.8, n === lit ? 1 : 0.75, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** Skills: four of the repository's skills as gems on plinths, the agent following one, named below. */
export function skillsScene(ctx: CanvasRenderingContext2D, time: number, since: number) {
  const lit = cardLitAt(time);
  glow(ctx, 50, 60, 18, 0.9);
  for (const n of [1, 2, 0, 3]) {
    const at = PLINTHS.at(n) ?? PLINTHS[0];
    popIn(ctx, at.x, at.y, since, n * 80, () => {
      plinth(ctx, n, lit, time);
    });
  }
  popIn(ctx, 50, 67, since, 320, () => {
    agent(ctx, 50, 67, time, 1.25, GEMS.at(lit) ?? colors.ice);
  });
  caption(ctx, lit, time);
}
