/**
 * What the studio says back as you play: a short verdict rising over the ring
 * for each word ("Perfect", "Good" or "Miss"), the combo at the screen's
 * other end, growing gently as it climbs, and the host's speech bubble with
 * the word just said. Each eases in and pops a little; none is ever smaller
 * than the body size, and only the latest one shows, so they never pile up.
 */
import { theme } from '../../../src/northpole/theme';
import { PHRASES } from './chart';
import { appear, pop } from './cues';
import { multiplier, type Game, type Judge } from './game';
import { latest } from './lane';
import { HEAD, LANE, SCENE } from './layout';
import { letter, measure, rounded, TYPE } from './lettering';

const { colors } = theme;

/** How long a verdict stays, in ms. */
const VERDICT = 700;
/** How long the host's bubble for a word said stays. */
const BUBBLE = 1_100;
/** The row over the screen where the verdict and the combo sit. */
const ROW = LANE.y - LANE.half - 3.4;

/** The verdicts' words and colours. */
const verdictOf = (judge: Judge): readonly [text: string, colour: string] =>
  judge === 'perfect'
    ? ['Perfect', colors.gold]
    : judge === 'good'
      ? ['Good', colors.mint]
      : ['Miss', colors.berry];

/** How visible something `ms` old is that lasts `life`: easing in, holding, then fading out. */
const lifetime = (ms: number, life: number) =>
  ms < 0 || ms >= life ? 0 : Math.min(appear(ms), (life - ms) / 200, 1);

/** The verdict for the latest word judged, rising a unit over the ring as it eases in. */
export function verdict(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const hit = latest(game);
  if (!hit) return;
  const ms = time - hit.at;
  const shown = lifetime(ms, VERDICT);
  if (shown <= 0) return;
  const [text, colour] = verdictOf(hit.judge);
  ctx.save();
  ctx.globalAlpha = shown;
  letter(ctx, text, { x: LANE.ring, y: ROW + 1 - appear(ms), height: TYPE.body, colour });
  ctx.restore();
}

/** The combo at the screen's right end, from two words in a row, a little bigger as it climbs. */
export function combo(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  if (game.combo < 2 || game.ended !== null) return;
  const hit = latest(game);
  const bump = hit ? pop(time - hit.at) : 1;
  const height = (TYPE.body + Math.min(0.9, (game.combo - 2) * 0.06)) * Math.min(1, bump);
  const times = `×${String(multiplier(game.combo))}`;
  const gap = measure(ctx, times, height) + 1.2;
  const at = { y: ROW, height, align: 'right' as const };
  letter(ctx, times, { ...at, x: LANE.right, colour: colors.gold });
  letter(ctx, `Combo ${String(game.combo)}`, {
    ...at,
    x: LANE.right - gap,
    colour: colors.snowLit,
  });
}

/** The host's speech bubble over their head, with the word just said, popping in. */
export function said(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const hit = latest(game);
  if (!hit || hit.judge === 'miss') return;
  const ms = time - hit.at;
  const shown = lifetime(ms, BUBBLE);
  if (shown <= 0) return;
  const text = PHRASES[game.hits.indexOf(hit) % PHRASES.length] ?? '';
  const width = measure(ctx, text, TYPE.lead) + 5;
  const x = Math.max(width / 2 + SCENE.x + 2, HEAD.x);
  const y = SCENE.y + 9;
  ctx.save();
  ctx.globalAlpha = shown;
  ctx.translate(x, y);
  ctx.scale(pop(ms), pop(ms));
  ctx.fillStyle = colors.shadow;
  rounded(ctx, -width / 2, -3.8 + 0.6, width, 7.6, 2.2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  rounded(ctx, -width / 2, -3.8, width, 7.6, 2.2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(HEAD.x - x - 2, 3.6);
  ctx.lineTo(HEAD.x - x + 1, 7.4);
  ctx.lineTo(HEAD.x - x + 2.5, 3.6);
  ctx.fill();
  letter(ctx, text, { x: 0, y: 0.2, height: TYPE.lead, colour: colors.ink });
  ctx.restore();
}
