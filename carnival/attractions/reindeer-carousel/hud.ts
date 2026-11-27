/**
 * What Ring Grab tells you over the scene: the demo's banner, the rings you've
 * caught and your misses while you ride, each ring flying into the tally with
 * "+1" or "+5 GOLD!", a "Miss!" for a tap with no ring in reach, and the card
 * when the ride is over. Everything fades in and out, nothing flashes.
 */
import { theme } from '../../../src/northpole/theme';
import { RING, ring } from './arm';
import { GUARD, MISSES, type Grab } from './grab';
import { letter, rounded } from './lettering';

const { colors } = theme;

/** How long a caught ring flies to the tally, and a "Miss!" shows, in ms. */
const FLY = 750;
/** Where the tally's ring sits, which caught rings fly to. */
const TALLY = { x: 9, y: 8.5 };

/** Smooth from 0 to 1 as `t` goes from 0 to 1, flat outside. */
function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** The dark panel every card sits on. */
function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha *= 0.86;
  rounded(ctx, x, y, w, h, 2.6);
  ctx.fill();
  ctx.globalAlpha /= 0.86;
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/** The demo's banner: the game's name and how to play. */
function demoBanner(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  ctx.globalAlpha = 0.9 + 0.1 * Math.sin(time / 900);
  panel(ctx, 3, 2.5, 36, 13.5);
  letter(ctx, 'Ring Grab', { x: 21, y: 7.4, height: 5.2, colour: colors.gold, width: 33 });
  letter(ctx, 'Tap to ride!', { x: 21, y: 12.6, height: 3, colour: colors.mint, width: 33 });
  panel(ctx, 61, 2.5, 36, 13.5);
  const lines = ['Tap as your reindeer', 'passes the glowing arm:', 'silver 1, gold 5'];
  lines.forEach((line, n) => {
    const colour = n === 2 ? colors.gold : colors.snowLit;
    letter(ctx, line, { x: 79, y: 6.2 + n * 3.6, height: 2.7, colour, width: 33 });
  });
  ctx.restore();
}

/** The scoreboard while you ride: rings caught, the best of the visit and the misses left. */
function scoreboard(ctx: CanvasRenderingContext2D, grab: Grab) {
  ctx.save();
  panel(ctx, 3, 2.5, 30, 12);
  ring(ctx, TALLY.x, TALLY.y, false, 1.1);
  const caught = `${String(grab.rings)} ${grab.rings === 1 ? 'ring' : 'rings'}`;
  letter(ctx, caught, { x: 22.5, y: 8.6, height: 5, colour: colors.snowLit, width: 17 });
  panel(ctx, 67, 2.5, 30, 12);
  const best = `Best ${String(Math.max(grab.best, grab.rings))}`;
  letter(ctx, best, { x: 82, y: 6.6, height: 3, colour: colors.gold, width: 26 });
  for (let n = 0; n < MISSES; n++) {
    const x = 76 + n * 6;
    const used = n < grab.misses;
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = used ? colors.berry : colors.muted;
    ctx.beginPath();
    ctx.arc(x, 11.2, 1.6, 0, Math.PI * 2);
    ctx.stroke();
    if (used) {
      ctx.beginPath();
      ctx.moveTo(x - 1.1, 10.1);
      ctx.lineTo(x + 1.1, 12.3);
      ctx.moveTo(x + 1.1, 10.1);
      ctx.lineTo(x - 1.1, 12.3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Each ring just caught flying up into the tally, its worth popping by the arm, and each miss. */
function moments(ctx: CanvasRenderingContext2D, grab: Grab, time: number) {
  for (const { at, worth } of grab.moments) {
    const t = (time - at) / FLY;
    if (t < 0 || t >= 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - ease((t - 0.6) / 0.4);
    const words = worth === 0 ? 'Miss!' : worth > 1 ? `+${String(worth)} GOLD!` : '+1';
    const colour = worth === 0 ? colors.berry : worth > 1 ? colors.gold : colors.snowLit;
    const spot = { x: RING.x + 4, y: RING.y - 10 - t * 6, height: 3.6, width: 30 };
    // A dark pill under the words keeps them clear against the striped canopy.
    const wide = 3 + words.length * 2.1;
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha *= 0.82;
    rounded(ctx, spot.x - wide / 2, spot.y - 2.8, wide, 5.6, 2.8);
    ctx.fill();
    ctx.globalAlpha /= 0.82;
    letter(ctx, words, { ...spot, colour });
    if (worth > 0 && grab.mode !== 'demo') {
      const k = ease(t);
      const x = RING.x + (TALLY.x - RING.x) * k;
      const y = RING.y + (TALLY.y - RING.y) * k - Math.sin(Math.PI * k) * 14;
      ring(ctx, x, y, worth > 1, 1.2 - 0.3 * k);
    }
    ctx.restore();
  }
}

/** The card once three misses end the ride: rings caught, the best of the visit, and ride again. */
function overCard(ctx: CanvasRenderingContext2D, grab: Grab, time: number) {
  const since = time - (grab.overAt ?? time);
  const on = ease((since - 300) / 450);
  if (on <= 0) return;
  ctx.save();
  ctx.globalAlpha = on;
  panel(ctx, 18, 14, 64, 30);
  const line = (text: string, y: number, height: number, colour: string) => {
    letter(ctx, text, { x: 50, y, height, colour, width: 58 });
  };
  line('Ride over!', 19.2, 4.4, colors.horizon);
  line(`${String(grab.rings)} ${grab.rings === 1 ? 'ring' : 'rings'}`, 26.4, 7, colors.gold);
  const record = grab.rings > 0 && grab.rings >= grab.best;
  line(
    record ? 'A new best this visit!' : `Best this visit: ${String(grab.best)}`,
    33,
    3,
    colors.snowLit,
  );
  ctx.globalAlpha = on * ease((since - GUARD) / 400);
  line('Tap to ride again', 39, 3.4, colors.mint);
  ctx.restore();
}

/** Everything Ring Grab shows over the carousel at `time`. */
export function hud(ctx: CanvasRenderingContext2D, grab: Grab, time: number) {
  if (grab.mode === 'demo') demoBanner(ctx, time);
  else scoreboard(ctx, grab);
  moments(ctx, grab, time);
  if (grab.mode === 'over') overCard(ctx, grab, time);
}
