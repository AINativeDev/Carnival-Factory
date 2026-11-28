/**
 * The end card, after the game, in the shape every Tessl place shares: a
 * title and one line on how the round went, one hero (Ask for a booth), two
 * secondaries side by side (Learn how in the Academy, Sign up for Tessl), a
 * quiet row to play again or watch the tour, and one quiet line to keep in
 * touch. Every button is a box in buttons.ts, so a tap lands where it is drawn.
 */
import { theme } from '../../../src/northpole/theme';
import { END_AGAIN, END_HERO, END_KEEP, END_MORE } from './buttons';
import { END_GUARD, type Show } from './show';
import { eyebrow, gift, words } from './text';
import { panel, primary, secondary, tertiary } from './ui';

const { colors } = theme;

/** The end card's heading: the round's title, and one line on its score, booths and best. */
export function endHeading(show: Show): { title: string; line: string } {
  const { score, best, shipped } = show.game;
  const record = score > 0 && score >= best ? 'New best' : `Best ${String(best)}`;
  const booths = `${String(shipped)} booth${shipped === 1 ? '' : 's'} shipped`;
  return { title: 'Loop complete', line: `${String(score)} points · ${booths} · ${record}` };
}

/** The round's booths, as a little stack of gifts beside the title, up to five. */
function shippedGifts(ctx: CanvasRenderingContext2D, shipped: number) {
  for (let n = 0; n < Math.min(shipped, 5); n++) {
    const row = n < 3 ? 0 : 1;
    const along = row ? n - 3 : n;
    gift(ctx, 77 + along * 4 + row * 2, 22 - row * 3.6, 3.4);
  }
}

/** The end card as it stands at `time`, rising in as it comes up; its buttons wake once `END_GUARD` has passed. */
export function endCard(ctx: CanvasRenderingContext2D, show: Show, time: number) {
  const since = time - show.since;
  const rise = Math.min(1, since / 400);
  ctx.save();
  ctx.translate(0, (1 - rise) * 4);
  ctx.globalAlpha = rise;
  panel(ctx, { x: 4, y: 4, w: 92, h: 84 }, 0.92);
  const heading = endHeading(show);
  eyebrow(ctx, 'Feed the loop', 9, 10, colors.gold);
  words(ctx, heading.title, 9, 17, 6.5, colors.snow, 'left', 64);
  words(ctx, heading.line, 9, 24, 3.6, colors.snowLit, 'left', 82);
  shippedGifts(ctx, show.game.shipped);
  // Asleep, the buttons are drawn faint, so a last frantic tap at the game opens nothing by surprise.
  ctx.globalAlpha = rise * (since >= END_GUARD ? 1 : 0.5);
  primary(ctx, END_HERO, time, 'The factory builds it for you');
  for (const more of END_MORE) secondary(ctx, more);
  for (const again of END_AGAIN) tertiary(ctx, again);
  words(ctx, 'Keep in touch:', 33, 78.5, 3, colors.muted, 'right');
  for (const keep of END_KEEP) tertiary(ctx, keep, colors.gold);
  ctx.restore();
}
