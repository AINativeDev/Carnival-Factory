/**
 * The track the words slide along into the mic, as a screen on the studio's
 * wall: speech bubbles easing in at its far end, gold ones to hold, and the
 * gold ring by the mic as the target. A word said pops the ring, and a short
 * verdict rises over it; the combo sits at the screen's other end and grows
 * gently as it climbs. Nothing on it ever leaves the screen.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { along, GOOD, TRAVEL } from './chart';
import { appear, ease, pop } from './cues';
import type { Game, Hit } from './game';
import { LANE } from './layout';
import { rounded } from './lettering';

const { colors } = theme;

/** How far a word is from the ring when it's `early` ms from its beat. */
const xOf = (early: number) => LANE.ring + along(early) * (LANE.far - LANE.ring);
/** How long before its beat a word starts to ease in at the far end. */
const SHOWN = TRAVEL + 250;

/** The screen's bezel and glass: a volume lit on its left, its shadow cast to the lower right. */
export function screen(ctx: CanvasRenderingContext2D) {
  const [x, y, w, h] = [LANE.left, LANE.y - LANE.half, LANE.right - LANE.left, LANE.half * 2];
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.8;
  rounded(ctx, x + 0.8, y + 0.9, w, h, 2.2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.ink;
  rounded(ctx, x, y, w, h, 2.2);
  ctx.fill();
  ctx.fillStyle = colors.slabShade;
  ctx.globalAlpha = 0.35;
  rounded(ctx, x, y, 0.8, h, 0.4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.night;
  rounded(ctx, x + 1, y + 1, w - 2, h - 2, 1.6);
  ctx.fill();
}

/** The glass's inside, as a clip, so words and tails stay on the screen. */
function glass(ctx: CanvasRenderingContext2D) {
  const [x, y, w, h] = [
    LANE.left + 1,
    LANE.y - LANE.half + 1,
    LANE.right - LANE.left - 2,
    LANE.half * 2 - 2,
  ];
  rounded(ctx, x, y, w, h, 1.6);
  ctx.clip();
}

/** One word coming in: a speech bubble with its dots, and a gold tail as long as it's held. */
function word(
  ctx: CanvasRenderingContext2D,
  x: number,
  tail: number,
  alpha: number,
  faded: boolean,
) {
  ctx.globalAlpha = alpha * (faded ? 0.35 : 1);
  if (tail > x) {
    ctx.fillStyle = colors.gold;
    rounded(ctx, x, LANE.y - 2.4, tail - x, 4.8, 2.4);
    ctx.fill();
  }
  ctx.fillStyle = faded ? colors.slabShade : colors.snowLit;
  ctx.beginPath();
  ctx.arc(x, LANE.y, 3.6, 0, Math.PI * 2);
  ctx.moveTo(x - 2.6, LANE.y + 1.5);
  ctx.lineTo(x - 4, LANE.y + 4.2);
  ctx.lineTo(x - 0.6, LANE.y + 3);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  for (const dx of [-1.4, 0, 1.4]) ctx.fillRect(dx + x - 0.45, LANE.y - 0.45, 0.9, 0.9);
  ctx.globalAlpha = 1;
}

/** The latest word judged, if any. */
export function latest(game: Game): Hit | undefined {
  return game.hits.reduce<Hit | undefined>(
    (last, hit) => (hit && (!last || hit.at >= last.at) ? hit : last),
    undefined,
  );
}

/** The ring by the mic: glowing as the next word nears, popping when one is said. */
function ring(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const next = game.hits.indexOf(null);
  const beat = next < 0 ? undefined : game.beats.at(next);
  const near = beat ? Math.abs(game.start + beat.at - time) : Infinity;
  const ready = ease(1 - near / (GOOD * 3));
  const hit = latest(game);
  const since = hit && hit.judge !== 'miss' ? time - hit.at : Infinity;
  const scale = since < 400 ? pop(since) * 1.12 - 0.12 * ease(since / 400) : 1;
  glow(ctx, LANE.ring, LANE.y, 9, 0.35 + ready * 0.65);
  ctx.fillStyle = colors.gold;
  ctx.globalAlpha = 0.1 + ready * 0.12;
  ctx.beginPath();
  ctx.arc(LANE.ring, LANE.y, 4.8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 1 + ready * 0.4;
  ctx.beginPath();
  ctx.arc(LANE.ring, LANE.y, 4.8 * scale, 0, Math.PI * 2);
  ctx.stroke();
  if (since < 500) {
    ctx.globalAlpha = 1 - since / 500;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(LANE.ring, LANE.y, 4.8 + (since / 500) * 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/** The track, its ring and the words on it, faded out by `fade` as the take plays back. */
export function lane(ctx: CanvasRenderingContext2D, game: Game, time: number, fade: number) {
  if (fade >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - fade;
  ctx.save();
  glass(ctx);
  ctx.fillStyle = colors.mountain;
  for (let x = LANE.ring + 7; x < LANE.right - 3; x += 3) ctx.fillRect(x, LANE.y - 0.2, 1.4, 0.4);
  ring(ctx, game, time);
  const base = 1 - fade;
  game.beats.forEach((b, n) => {
    const hit = game.hits.at(n);
    const early = game.start + b.at - time;
    const tail = b.hold ? xOf(early + b.hold) : 0;
    const shown = base * appear(SHOWN - early);
    if (game.holding === n) word(ctx, LANE.ring, tail, base, false);
    else if (!hit && early < SHOWN) word(ctx, xOf(early), tail, shown, false);
    else if (hit?.judge === 'miss' && early > -600)
      word(ctx, xOf(early), tail, base * (1 + early / 600), true);
  });
  ctx.restore();
  ctx.restore();
}
