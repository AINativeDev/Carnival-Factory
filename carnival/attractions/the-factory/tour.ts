/**
 * The tour's frame round each scene: a slim header on the sky (an eyebrow with
 * where you are, the step's title and two short lines), the scene on the slab,
 * and a footer with the step's dots and how to go on on the left, and the one
 * primary on the right: Next, or on the last step the way into the game. A
 * quiet "Skip to the game" sits top right. It waits on each step for a tap.
 */
import { theme } from '../../../src/northpole/theme';
import { SKIP, tourButtons } from './buttons';
import type { Show } from './show';
import { eyebrow, words } from './text';
import { TOUR_STEPS, type TourStep } from './tour-copy';
import { factoryScene } from './tour-factory';
import { loopsScene } from './tour-loops';
import { skillsScene, whyScene } from './tour-scenes';
import { easeIn, panel, primary, tertiary } from './ui';

const { colors } = theme;

/** Each step's scene, in order. */
const SCENES = [whyScene, skillsScene, loopsScene, factoryScene] as const;

/** The header: where you are, then the step's title and two lines, easing in as the step begins. */
function header(ctx: CanvasRenderingContext2D, step: number, since: number) {
  const copy: TourStep = TOUR_STEPS.at(step) ?? { title: '', lines: ['', ''] };
  const where = `How a factory works · ${String(step + 1)} of ${String(TOUR_STEPS.length)}`;
  eyebrow(ctx, where, 6, 8, colors.gold, 'left', 56);
  const ease = easeIn(since);
  const rise = 1 - ease;
  ctx.globalAlpha = ease;
  words(ctx, copy.title, 6, 14.6 + rise, 6.5, colors.snow, 'left', 88);
  copy.lines.forEach((line, n) => {
    words(ctx, line, 6, 21 + n * 4.6 + rise, 3.6, colors.snowLit, 'left', 88);
  });
  ctx.globalAlpha = 1;
}

/** What the footer's hint says: start, go on, or play. */
export function hintOf(show: Show): string {
  if (show.step >= TOUR_STEPS.length - 1) return 'Tap or → to play';
  return show.fresh ? 'Tap or → to start' : 'Tap or → to go on';
}

/** The footer's left: the step's dots and the hint, on a soft panel. */
function footer(ctx: CanvasRenderingContext2D, show: Show) {
  panel(ctx, { x: 4, y: 87.5, w: 52, h: 9 });
  TOUR_STEPS.forEach((_, n) => {
    ctx.fillStyle = n === show.step ? colors.gold : colors.muted;
    ctx.beginPath();
    ctx.arc(8.5 + n * 3.4, 92, n === show.step ? 1.1 : 0.75, 0, Math.PI * 2);
    ctx.fill();
  });
  words(ctx, hintOf(show), 22, 92.1, 3, colors.snowLit, 'left', 32);
}

/** The tour as it stands at `time`: its scene on the slab, its header over the sky, and its footer. */
export function tour(ctx: CanvasRenderingContext2D, show: Show, time: number) {
  const since = time - show.since;
  const scene = SCENES.at(show.step) ?? whyScene;
  scene(ctx, time, since);
  header(ctx, show.step, since);
  footer(ctx, show);
  for (const button of tourButtons(show.step, TOUR_STEPS.length)) {
    if (button === SKIP) tertiary(ctx, button);
    else primary(ctx, button, time);
  }
}
