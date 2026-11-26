/**
 * The track the words slide along into the mic: speech bubbles to tap as they
 * reach the ring, gold ones to hold, a burst and a verdict on every word, the
 * combo, and the host saying each word said in a bubble of its own.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { along, GOOD, PHRASES } from './chart';
import { pop } from './cues';
import { multiplier, type Game, type Hit, type Judge } from './game';
import { letter, measure, rounded } from './lettering';

const { colors } = theme;

/** The track: where the ring is, where words come in from, and its middle line. */
export const LANE = { ring: 54, far: 97, y: 36, left: 47, right: 99 };
/** How long the host's bubble for a word said floats. */
const BUBBLE = 1_300;

/** The verdicts' words and colours. */
const verdictOf = (judge: Judge): readonly [text: string, colour: string] =>
  judge === 'perfect'
    ? ['PERFECT!', colors.gold]
    : judge === 'good'
      ? ['GOOD', colors.mint]
      : ['MISS', colors.berry];

const xOf = (early: number) => LANE.ring + along(early) * (LANE.far - LANE.ring);

/** One word coming in: a speech bubble with its dots, and a gold tail as long as it's held. */
function word(ctx: CanvasRenderingContext2D, x: number, tail: number, faded: boolean) {
  ctx.globalAlpha = faded ? 0.35 : 1;
  if (tail > x) {
    ctx.fillStyle = colors.gold;
    rounded(ctx, x, LANE.y - 2.6, tail - x, 5.2, 2.6);
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
function latest(game: Game): Hit | undefined {
  return game.hits.reduce<Hit | undefined>(
    (last, hit) => (hit && (!last || hit.at >= last.at) ? hit : last),
    undefined,
  );
}

/** The track, its ring, the words on it and the verdicts, faded out by `fade`. */
export function lane(ctx: CanvasRenderingContext2D, game: Game, time: number, fade: number) {
  if (fade >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - fade;
  ctx.fillStyle = colors.ink;
  rounded(ctx, LANE.left, LANE.y - 6.5, LANE.right - LANE.left, 13, 6.5);
  ctx.fill();
  ctx.fillStyle = colors.night;
  rounded(ctx, LANE.left + 0.8, LANE.y - 5.7, LANE.right - LANE.left - 1.6, 11.4, 5.7);
  ctx.fill();
  ctx.fillStyle = colors.mountain;
  for (let x = LANE.ring + 6; x < LANE.right - 2; x += 3) ctx.fillRect(x, LANE.y - 0.2, 1.4, 0.4);
  const next = game.hits.indexOf(null);
  const beat = next < 0 ? undefined : game.beats.at(next);
  const near = beat ? Math.abs(game.start + beat.at - time) : Infinity;
  const ready = Math.max(0, 1 - near / (GOOD * 2));
  glow(ctx, LANE.ring, LANE.y, 8, ready);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.8 + ready * 0.5;
  ctx.beginPath();
  ctx.arc(LANE.ring, LANE.y, 4.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(LANE.left, LANE.y - 7, LANE.right - LANE.left, 14);
  ctx.clip();
  game.beats.forEach((b, n) => {
    const hit = game.hits.at(n);
    const early = game.start + b.at - time;
    const tail = b.hold ? xOf(early + b.hold) : 0;
    if (game.holding === n) word(ctx, LANE.ring, tail, false);
    else if (!hit && early < 2_100) word(ctx, xOf(early), tail, false);
    else if (hit?.judge === 'miss' && early > -900) word(ctx, xOf(early), tail, true);
  });
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 1 - fade;
  verdict(ctx, game, time);
  ctx.restore();
}

/** The burst round the ring and the verdict over it, for the latest word judged. */
function verdict(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const hit = latest(game);
  const age = hit ? (time - hit.at) / 650 : 1;
  if (!hit || age >= 1) return;
  const [text, colour] = verdictOf(hit.judge);
  const alpha = ctx.globalAlpha;
  if (hit.judge !== 'miss') {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = alpha * (1 - age);
    ctx.beginPath();
    ctx.arc(LANE.ring, LANE.y, 4.6 + age * 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = alpha * Math.min(1, (1 - age) * 3);
  const size = pop(age);
  letter(ctx, text, { x: LANE.ring + 2, y: 26.5 - age * 2, height: 4 * size, colour });
  if (game.combo >= 2) {
    const combo = `COMBO ${String(game.combo)}  ×${String(multiplier(game.combo))}`;
    letter(ctx, combo, { x: 96, y: 26.5, height: 3, colour: colors.snowLit, align: 'right' });
  }
  ctx.globalAlpha = alpha;
}

/** The host's bubbles: each word said floats up from the host, alternately left and right. */
export function said(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  game.hits.forEach((hit, n) => {
    if (!hit || hit.judge === 'miss') return;
    const age = (time - hit.at) / BUBBLE;
    if (age < 0 || age >= 1) return;
    const text = PHRASES[n % PHRASES.length] ?? '';
    const [x, y] = n % 2 ? [14, 33] : [31, 28];
    const width = measure(ctx, text, 3.8) + 5;
    ctx.save();
    ctx.translate(Math.max(width / 2 + 1, x), y - age * 4);
    ctx.scale(pop(age), pop(age));
    ctx.globalAlpha = Math.min(1, (1 - age) * 4);
    ctx.fillStyle = colors.snowLit;
    rounded(ctx, -width / 2, -3.9, width, 7.8, 3.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1, 3);
    ctx.lineTo(4, 7);
    ctx.lineTo(4.5, 3);
    ctx.fill();
    letter(ctx, text, { x: 0, y: 0.2, height: 3.8, colour: colors.ink });
    ctx.restore();
  });
}
