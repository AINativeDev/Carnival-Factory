/**
 * The host: an elf behind the desk, talking into the big studio mic through
 * its pop filter while the take records, then listening back in headphones,
 * eyes shut, nodding along.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { rounded } from './lettering';

const { colors } = theme;

/** Where the host's head is, and how big. */
const HEAD = { x: 25, y: 47, r: 7.5 };
/** Where the mic's grille is. */
const MIC = { x: 43, y: 43 };

/** How the host is at a moment: how loud, how far the headphones are on, and the time. */
export interface Mood {
  loud: number;
  talking: boolean;
  headphones: number;
  time: number;
}

/** The elf's pointed hat, its tip swaying, with a snowy band and a pom. */
function hat(ctx: CanvasRenderingContext2D, time: number) {
  const { x, y, r } = HEAD;
  const tip = { x: x + 7 + Math.sin(time / 900) * 1.2, y: y - r - 10 };
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.moveTo(x - r - 0.5, y - r * 0.35);
  ctx.quadraticCurveTo(x - 1, y - r - 9, tip.x, tip.y);
  ctx.quadraticCurveTo(x + 3, y - r - 2, x + r + 0.5, y - r * 0.35);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  rounded(ctx, x - r - 1, y - r * 0.6, r * 2 + 2, 3, 1.5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

/** The face: pointed ears, rosy cheeks, eyes open while talking and shut, smiling, while listening. */
function face(ctx: CanvasRenderingContext2D, mood: Mood) {
  const { x, y, r } = HEAD;
  ctx.fillStyle = colors.cream;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * (r - 1), y - 2);
    ctx.lineTo(x + side * (r + 4), y - 4.5);
    ctx.lineTo(x + side * (r - 0.5), y + 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.horizon;
  ctx.globalAlpha = 0.7;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * 4.2, y + 2.2, 1.6, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.ink;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  const blink = mood.time % 4_200 < 140;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    if (mood.headphones > 0.5) ctx.arc(x + side * 2.6, y - 0.6, 1.1, Math.PI * 1.1, Math.PI * 1.9);
    else if (blink) ctx.ellipse(x + side * 2.6, y - 0.5, 1, 0.2, 0, 0, Math.PI * 2);
    else ctx.ellipse(x + side * 2.6, y - 0.5, 0.85, 1.15, 0, 0, Math.PI * 2);
    if (mood.headphones > 0.5) ctx.stroke();
    else ctx.fill();
  }
  // The mouth: open as wide as the take is loud while talking, a smile otherwise.
  ctx.beginPath();
  if (mood.talking) {
    ctx.ellipse(x + 0.6, y + 3.6, 1.6 + mood.loud * 0.6, 0.4 + mood.loud * 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(x + 0.4, y + 2.6, 1.8, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
}

/** Big studio headphones, sliding down over the hat as `on` goes from 0 to 1. */
function headphones(ctx: CanvasRenderingContext2D, on: number) {
  if (on <= 0) return;
  const { x, y, r } = HEAD;
  const drop = (1 - on) * -9;
  ctx.globalAlpha = on;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y + drop, r + 2.4, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.fillStyle = colors.ink;
    rounded(ctx, x + side * (r + 1.6) - 2, y - 3 + drop, 4, 6.5, 1.6);
    ctx.fill();
    ctx.fillStyle = colors.berry;
    rounded(ctx, x + side * (r + 1.6) - 1.3, y - 2.3 + drop, 2.6, 5.1, 1.2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The host from the waist up: a striped jumper, the face, the hat and any headphones. */
export function host(ctx: CanvasRenderingContext2D, mood: Mood) {
  const { x, y, r } = HEAD;
  ctx.fillStyle = colors.berry;
  rounded(ctx, x - 10, y + r - 1, 20, 14, 5);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  for (const stripe of [3.5, 7.5]) ctx.fillRect(x - 10, y + r - 1 + stripe, 20, 1.3);
  ctx.save();
  // A nod while listening, a bob while talking: both about the neck.
  const nod = mood.headphones * Math.sin(mood.time / 240) * 0.09 + mood.loud * 0.05;
  ctx.translate(x, y + r);
  ctx.rotate(nod);
  ctx.translate(-x, -y - r);
  face(ctx, mood);
  hat(ctx, mood.time);
  headphones(ctx, mood.headphones);
  ctx.restore();
}

/** The big studio mic on its boom arm, with a pop filter, its grille glowing red as it hears you. */
export function mic(ctx: CanvasRenderingContext2D, hears: number) {
  const { x, y } = MIC;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 7);
  ctx.lineTo(x + 6, y + 14);
  ctx.lineTo(x + 7, y + 23);
  ctx.stroke();
  if (hears > 0) {
    glow(ctx, x, y, 9, hears);
    ctx.fillStyle = colors.berry;
    ctx.globalAlpha = 0.35 * hears;
    ctx.beginPath();
    ctx.arc(x, y - 1, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.2);
  ctx.fillStyle = colors.slabShade;
  rounded(ctx, -3.2, 0, 6.4, 8, 1.4);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-3.4, -0.6, 6.8, 1.2);
  ctx.fillStyle = colors.ink;
  rounded(ctx, -3.2, -8, 6.4, 8, 3.2);
  ctx.fill();
  ctx.strokeStyle = colors.slabShade;
  ctx.lineWidth = 0.3;
  for (let n = -6; n <= -1; n += 1.2) {
    ctx.beginPath();
    ctx.moveTo(-2.6, n);
    ctx.lineTo(2.6, n);
    ctx.stroke();
  }
  ctx.restore();
  // The pop filter between the mic and the host's mouth, seen nearly edge on.
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(x - 5.2, y + 1, 1.5, 4.4, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
}
