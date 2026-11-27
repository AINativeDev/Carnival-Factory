/**
 * The front row of the audience, seen from behind along the bottom of the
 * tent: elves in bobble hats who sway along while the act plays, clap and
 * bob when it ends well, and throw up their hands with an "Oh!" at a drop.
 */
import { theme } from '../../../src/northpole/theme';
import { applause, type Ring } from './act';
import { letter } from './lettering';

const { colors } = theme;

/** The audience's hats, one colour each, along the row. */
const HATS = [colors.pine, colors.berry, colors.violet, colors.gold, colors.pine, colors.berry];
/** Where each elf of the row sits across the tent, and how far down. */
const SEATS = [9, 25, 41, 59, 75, 91];

/** How the row reacts at `time`: clapping, gasping, or neither, and for how long it has. */
function reaction(ring: Ring, time: number): { clap: number; gasp: number } {
  const { act } = ring;
  if (!act.visitor || act.dropped === null) return { clap: 0, gasp: 0 };
  const since = time - act.dropped;
  const strength = since < 0 ? 0 : Math.min(1, since / 300) * Math.max(0, 1 - since / 6_000);
  return applause(ring) ? { clap: strength, gasp: 0 } : { clap: 0, gasp: strength };
}

/** One elf of the audience from behind, at (x, y): back, head and bobble hat; arms up to clap or in shock. */
function spectator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hat: string,
  arms: { up: number; clap: number },
) {
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.ellipse(x, y + 7, 7, 6, 0, Math.PI, 0);
  ctx.fill();
  if (arms.up > 0) {
    ctx.strokeStyle = colors.surface;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 5, y + 3);
      ctx.lineTo(x + side * (3.5 - arms.clap * 1.6), y - 3 - arms.up * 3);
      ctx.stroke();
    }
  }
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.arc(x, y, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hat;
  ctx.beginPath();
  ctx.arc(x, y - 0.6, 3.7, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 3.9, y - 1, 7.8, 1.3);
  ctx.beginPath();
  ctx.arc(x, y - 4.8, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

/** The whole front row at `time`, and a word or two from it as the act ends. */
export function crowd(ctx: CanvasRenderingContext2D, ring: Ring, time: number) {
  const { clap, gasp } = reaction(ring, time);
  SEATS.forEach((x, n) => {
    const sway = Math.sin(time / 1_100 + n) * 0.5;
    const bob = clap * Math.abs(Math.sin(time / 160 + n * 0.9)) * 1.2;
    const y = 93 - bob - gasp * 1.5;
    const arms = { up: Math.max(clap, gasp), clap: clap * Math.abs(Math.sin(time / 110 + n)) };
    spectator(ctx, x + sway, y, HATS.at(n) ?? colors.pine, arms);
  });
  const voice = Math.max(clap, gasp);
  if (voice <= 0) return;
  ctx.globalAlpha = voice;
  const words = clap > 0 ? ['Hooray!', 'Bravo!'] : ['Oh!', 'Ooh!'];
  words.forEach((word, n) => {
    const x = n ? 72 : 28;
    letter(ctx, word, {
      x,
      y: 82 - n * 1.5,
      height: 3.6,
      colour: clap > 0 ? colors.gold : colors.cream,
    });
  });
  ctx.globalAlpha = 1;
}
