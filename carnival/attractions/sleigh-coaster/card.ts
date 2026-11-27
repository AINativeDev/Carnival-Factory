/**
 * The run's card, once the sleigh has tumbled into the snow or the clock has
 * run out: how the run ended, its distance and presents, its score and the
 * best of the visit, and the tap to ride again.
 */
import { theme } from '../../../src/northpole/theme';
import { cardAt, type Coaster, GUARD, PRESENT_POINTS, scoreOf } from './game';
import { gift } from './hud';
import { letter, panel } from './lettering';

const { colors } = theme;

/** How long the card takes to fade in, in ms. */
const FADE = 400;

/** What the card says the run ended with. */
export function verdictOf(coaster: Coaster): string {
  return coaster.sleigh.off ? 'Off the rails!' : 'Time’s up!';
}

/** The card, faded in once the run is over. */
export function drawCard(ctx: CanvasRenderingContext2D, coaster: Coaster, time: number) {
  const at = cardAt(coaster);
  if (coaster.phase !== 'over' || at === null) return;
  const since = time - at;
  ctx.save();
  ctx.globalAlpha = Math.min(1, since / FADE);
  const [x, y, w, h] = [20, 17, 60, 46];
  panel(ctx, x, y, w, h);
  const off = coaster.sleigh.off;
  letter(ctx, verdictOf(coaster), {
    ...{ x: 50, y: y + 6, height: 5.4, colour: off ? colors.berry : colors.gold, width: w - 6 },
  });
  const metres = Math.floor(coaster.sleigh.x);
  const row = { x: x + 5, height: 3.2, colour: colors.snowLit, align: 'left' as const };
  letter(ctx, 'Distance', { ...row, y: y + 13.5 });
  letter(ctx, `${String(metres)} m`, { ...row, x: x + w - 5, y: y + 13.5, align: 'right' });
  letter(ctx, 'Presents', { ...row, y: y + 19 });
  gift(ctx, x + 22, y + 19, 2.8, colors.berry);
  const presents = `${String(coaster.caught.length)} × ${String(PRESENT_POINTS)}`;
  letter(ctx, presents, { ...row, x: x + w - 5, y: y + 19, align: 'right' });
  ctx.fillStyle = colors.muted;
  ctx.fillRect(x + 5, y + 22.6, w - 10, 0.3);
  const score = scoreOf(coaster);
  letter(ctx, `Score ${String(score)}`, { x: 50, y: y + 28, height: 5.4, colour: colors.gold });
  const best = coaster.best;
  const record = score >= best && score > 0;
  letter(ctx, record ? 'New best of your visit!' : `Best of your visit: ${String(best)}`, {
    ...{ x: 50, y: y + 34, height: 3, colour: record ? colors.mint : colors.muted, width: w - 6 },
  });
  if (since >= GUARD) {
    const swell = 1 + Math.sin(time / 500) * 0.03;
    letter(ctx, 'Tap to ride again', {
      ...{ x: 50, y: y + 40.5, height: 3.6 * swell, colour: colors.snowLit },
    });
  }
  ctx.restore();
}
