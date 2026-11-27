/**
 * The act's words over the ring: the scoreboard with the catches, the streak
 * and the best of the visit, a line telling a visitor what to do, the sparkle
 * and points on each catch, the puff of a miss, and the card when the act ends.
 */
import { theme } from '../../../src/northpole/theme';
import { applause, CARD, multiplier, type Act, type Ring } from './act';
import { letter, rounded } from './lettering';

const { colors } = theme;

/** How long a catch's sparkle and points, or a miss's puff, last, in ms. */
const POP = 650;
/** How long a new bauble's "Another bauble!" stays up, in ms. */
const JOINED = 1_400;

/** A dark board at (x, y), `w` by `h`. */
function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha = 0.82;
  rounded(ctx, x, y, w, h, 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The scoreboard along the top: catches and score on the left, the streak, and the best on the right. */
export function scoreboard(ctx: CanvasRenderingContext2D, ring: Ring) {
  const { act, best } = ring;
  plate(ctx, 3, 3, 30, 12);
  plate(ctx, 67, 3, 30, 12);
  const small = { y: 6.2, height: 2.6, colour: colors.muted };
  if (act.visitor) {
    letter(ctx, 'CATCHES', { ...small, x: 18 });
    letter(ctx, String(act.catches), { x: 18, y: 11, height: 6, colour: colors.gold });
  } else letter(ctx, 'JUGGLING ELF', { x: 18, y: 9, height: 3.4, colour: colors.gold });
  letter(ctx, 'BEST', { ...small, x: 82 });
  letter(ctx, String(best), { x: 82, y: 11, height: 6, colour: colors.cream });
  if (!act.visitor) return;
  letter(ctx, `SCORE ${String(act.score)}`, { x: 50, y: 6, height: 3.6, colour: colors.cream });
  const times = multiplier(act.streak);
  if (times > 1) {
    const label = `STREAK ×${String(times)}`;
    letter(ctx, label, { x: 50, y: 11, height: 3, colour: colors.aurora });
  }
}

/** What to do next, in a pill under the scoreboard: how to start, or how to catch. */
export function hint(ctx: CanvasRenderingContext2D, act: Act, time: number) {
  let text = '';
  if (!act.visitor) text = 'Tap to juggle!';
  else if (act.dropped === null && time - act.joined < JOINED) text = 'Another bauble!';
  else if (act.dropped === null && act.catches < 3) text = 'Tap each bauble as it falls';
  if (!text) return;
  plate(ctx, 28, 17, 44, 6.4);
  const colour = act.visitor && act.catches >= 3 ? colors.aurora : colors.cream;
  letter(ctx, text, { x: 50, y: 20.3, height: 3.4, colour });
}

/** The last tap: on a catch, gold sparks and its points rising; on a miss, a cool puff and "Miss". */
export function pop(ctx: CanvasRenderingContext2D, act: Act, time: number) {
  const tap = act.pop;
  const since = tap ? time - tap.at : Infinity;
  if (!tap || since < 0 || since >= POP) return;
  const t = since / POP;
  ctx.globalAlpha = 1 - t;
  if (tap.points > 0) {
    ctx.fillStyle = colors.gold;
    for (let n = 0; n < 6; n++) {
      const turn = (n / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        tap.x + Math.cos(turn) * (3 + t * 6),
        tap.y + Math.sin(turn) * (3 + t * 6),
        0.8,
        0,
        7,
      );
      ctx.fill();
    }
    const words = { x: tap.x, y: tap.y - 6 - t * 6, height: 4, colour: colors.gold };
    letter(ctx, `+${String(tap.points)}`, words);
  } else {
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, 2 + t * 4, 0, Math.PI * 2);
    ctx.stroke();
    letter(ctx, 'Miss', { x: tap.x, y: tap.y - 5 - t * 3, height: 3, colour: colors.cream });
  }
  ctx.globalAlpha = 1;
}

/** The card once the act ends: how it went, the score and the best, and a tap to go again. */
export function card(ctx: CanvasRenderingContext2D, ring: Ring, time: number) {
  const { act } = ring;
  if (!act.visitor || act.dropped === null) return;
  const since = time - act.dropped - 500;
  if (since <= 0) return;
  ctx.globalAlpha = Math.min(1, since / 400);
  plate(ctx, 20, 25, 60, 34);
  const cheer = applause(ring);
  const title = cheer ? 'Bravo!' : 'Dropped it!';
  letter(ctx, title, { x: 50, y: 31.5, height: 6, colour: cheer ? colors.gold : colors.horizon });
  const caught = `${String(act.catches)} ${act.catches === 1 ? 'catch' : 'catches'}`;
  const line = `${caught} · ${String(act.score)} points`;
  letter(ctx, line, { x: 50, y: 39, height: 3.6, colour: colors.cream });
  const best = ring.record ? 'New best of the visit!' : `Best ${String(ring.best)}`;
  letter(ctx, best, {
    x: 50,
    y: 45,
    height: 3.2,
    colour: ring.record ? colors.aurora : colors.muted,
  });
  if (time - act.dropped >= CARD) {
    ctx.fillStyle = colors.gold;
    rounded(ctx, 33, 49.5, 34, 6.5, 3.25);
    ctx.fill();
    letter(ctx, 'Tap to go again', { x: 50, y: 52.8, height: 3.4, colour: colors.ink });
  }
  ctx.globalAlpha = 1;
}
