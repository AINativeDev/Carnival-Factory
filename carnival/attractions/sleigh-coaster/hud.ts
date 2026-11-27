/**
 * What the coaster shows over the ride: the presents floating over the
 * crests, a "+50" where one is caught, the run's distance, presents and clock
 * along the top, the call to ride while the elf drives, and the hint to hold
 * as a run leaves the station.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { presents } from './course';
import { clockLeft, type Coaster, PRESENT_POINTS } from './game';
import { letter, panel } from './lettering';
import type { Pose } from './pose';
import { onScreen } from './scenery';

const { colors } = theme;

/** The wrapping paper the presents come in, in turn. */
const PAPER = [colors.berry, colors.mint, colors.violet, colors.gold] as const;

/** One present `s` units across at `x`, `y`, in paper `paper` with a ribbon round it. */
export function gift(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  paper: string,
) {
  ctx.fillStyle = paper;
  ctx.fillRect(x - s / 2, y - s / 2, s, s);
  ctx.fillStyle = paper === colors.gold ? colors.berry : colors.gold;
  ctx.fillRect(x - s * 0.1, y - s / 2, s * 0.2, s);
  ctx.fillRect(x - s / 2, y - s * 0.1, s, s * 0.2);
  ctx.beginPath();
  ctx.ellipse(x - s * 0.2, y - s / 2 - s * 0.12, s * 0.2, s * 0.12, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.2, y - s / 2 - s * 0.12, s * 0.2, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The presents still to catch in view, bobbing gently in a warm glow, and a "+50" where one was caught. */
export function drawPresents(
  ctx: CanvasRenderingContext2D,
  coaster: Coaster,
  cam: number,
  time: number,
) {
  presents().forEach((present, n) => {
    if (present.x < cam - 4 || present.x > cam + 130 || coaster.caught.includes(n)) return;
    const at = onScreen(present.x, present.y, cam);
    const y = at.y + Math.sin(time / 450 + n) * 0.6;
    glow(ctx, at.x, y, 5, 0.7);
    gift(ctx, at.x, y, 3.4, PAPER[n % PAPER.length] ?? colors.gold);
  });
  const since = time - coaster.caughtAt;
  const last = presents().at(coaster.caught.at(-1) ?? -1);
  if (since > 900 || !last) return;
  const at = onScreen(last.x, last.y, cam);
  ctx.globalAlpha = 1 - since / 900;
  letter(ctx, `+${String(PRESENT_POINTS)}`, {
    ...{ x: at.x, y: at.y - 4 - since / 120, height: 4, colour: colors.gold },
  });
  ctx.globalAlpha = 1;
}

/** "0:32" for `ms` left on the clock, rounded up to the second. */
export function clockText(ms: number): string {
  const seconds = Math.ceil(ms / 1_000);
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The run's distance, presents and clock along the top. */
export function drawChips(ctx: CanvasRenderingContext2D, coaster: Coaster, time: number) {
  const left = clockLeft(coaster, time);
  panel(ctx, 3, 3, 30, 9);
  letter(ctx, `${String(Math.floor(coaster.sleigh.x))} m`, {
    ...{ x: 18, y: 7.6, height: 4.4, colour: colors.snowLit, width: 27 },
  });
  panel(ctx, 36, 3, 28, 9);
  gift(ctx, 43, 8, 4, colors.berry);
  letter(ctx, `× ${String(coaster.caught.length)}`, {
    ...{ x: 48, y: 7.6, height: 4.4, colour: colors.gold, align: 'left' },
  });
  panel(ctx, 67, 3, 30, 9);
  const urgent = left < 10_000 && coaster.phase === 'ride';
  letter(ctx, clockText(left), {
    ...{ x: 82, y: 7.1, height: 4.4, colour: urgent ? colors.berry : colors.snowLit },
  });
  // The clock's bar, draining as the run goes.
  ctx.fillStyle = colors.ink;
  ctx.fillRect(70, 10.2, 24, 0.9);
  ctx.fillStyle = urgent ? colors.berry : colors.mint;
  ctx.fillRect(70, 10.2, (24 * left) / 45_000, 0.9);
}

/** The call to ride, while the elf drives: what the game is and how to play it. */
export function drawBanner(ctx: CanvasRenderingContext2D, best: number, time: number) {
  panel(ctx, 12, 3, 76, 17);
  letter(ctx, 'BOOST & BRAKE', { x: 50, y: 7, height: 3, colour: colors.gold });
  const swell = 1 + Math.sin(time / 500) * 0.03;
  letter(ctx, 'Tap to ride!', { x: 50, y: 11.8, height: 5.2 * swell, colour: colors.snowLit });
  const how =
    best > 0
      ? `Hold to push, let go to coast · Best ${String(best)}`
      : 'Hold to push, let go to coast';
  letter(ctx, how, { x: 50, y: 16.6, height: 2.6, colour: colors.muted, width: 72 });
}

/** The hint to hold, by the sleigh as it leaves the station, fading after a few seconds. */
export function drawHint(
  ctx: CanvasRenderingContext2D,
  coaster: Coaster,
  pose: Pose,
  time: number,
) {
  const since = time - coaster.start;
  if (coaster.phase !== 'ride' || since > 4_000) return;
  ctx.globalAlpha = Math.min(1, (4_000 - since) / 800);
  panel(ctx, pose.x - 2, pose.y - 27, 40, 8);
  letter(ctx, coaster.pushing ? 'Let go before the top!' : 'Hold to push!', {
    ...{ x: pose.x + 18, y: pose.y - 23, height: 3.4, colour: colors.gold, width: 37 },
  });
  ctx.globalAlpha = 1;
}
