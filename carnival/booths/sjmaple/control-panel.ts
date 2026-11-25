import { theme } from '../../../src/northpole/theme';
import { BUTTONS, type Button, font, GRID, type Plot, SPIN_BUTTON } from './board';
import { type Build, partsOf } from './parts';
import { rating, type Stage, type Test } from './test-mat';
import { partIcon } from './tops';

const { colors } = theme;

/**
 * The parts board: one button for each part, showing the one picked, lit
 * under the pointer and greyed while a top is out (`busy`).
 */
export function partsBoard(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  size: number,
  build: Build,
  hovered: Button | null,
  busy: boolean,
) {
  const picked = partsOf(build);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = font(size, 3.6);
  for (const b of BUTTONS) {
    const part = b.name;
    if (part === 'spin') continue;
    const lit = hovered === part && !busy;
    plot(colors.cocoa, b.x, b.y, b.w, b.h);
    plot(
      busy ? colors.slabShade : lit ? colors.glow : colors.cream,
      b.x + 1,
      b.y + 1,
      b.w - 2,
      b.h - 2,
    );
    partIcon(plot, part, build, b.x + b.w - 5, b.y + b.h / 2 - 0.5);
    const choice =
      part === 'body'
        ? picked.body.name
        : part === 'stripe'
          ? picked.stripe.name
          : picked.handle.name;
    ctx.fillStyle = busy ? colors.muted : colors.ink;
    ctx.fillText(
      `${part.toUpperCase()} ${choice}`,
      (size * (b.x + 1.6)) / GRID,
      (size * (b.y + b.h / 2)) / GRID,
      (size * (b.w - 9)) / GRID,
    );
  }
}

/** Where the test on the mat stands, as far as the test board reports it. */
export interface TestReport {
  /** The top's test, or null before anything was let go. */
  test: Test | null;
  /** Milliseconds since the top was let go: below 0 while the elf is still building theirs. */
  since: number;
  stage: Stage;
  progress: number;
  /** Whether it is the elf's own round, nobody playing. */
  demo: boolean;
  /** The visitor's longest spin this visit, in milliseconds, or 0. */
  best: number;
}

/** The test board's two lines: what to do next, or how the last top spun and behaved. */
export function testBoardLines(report: TestReport): [string, string] {
  const { test, since, stage, progress, demo, best } = report;
  if (test && since >= 0 && stage !== 'carry') {
    const spun = stage === 'spin' ? progress * test.spin : test.spin;
    let line1 = `${(spun / 1000).toFixed(1)}s`;
    if (stage !== 'spin') line1 += ` ${rating(test.wobble)}`;
    return [line1, demo ? 'TAP TO BUILD' : best ? `BEST ${(best / 1000).toFixed(1)}s` : ''];
  }
  if (demo) return ['TAP A PART', 'TO BUILD'];
  if (stage === 'carry') return ['TESTING...', ''];
  return ['PICK PARTS', 'THEN SPIN'];
}

/** The spin button, gold while it can be pressed, and the test board beneath it. */
export function spinAndTestBoard(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  size: number,
  report: TestReport,
  hovered: Button | null,
  ready: boolean,
) {
  const sb = SPIN_BUTTON;
  plot(colors.cocoa, sb.x, sb.y, sb.w, sb.h);
  plot(
    ready ? (hovered === 'spin' ? colors.glow : colors.gold) : colors.slabShade,
    sb.x + 1,
    sb.y + 1,
    sb.w - 2,
    sb.h - 2,
  );
  ctx.textAlign = 'center';
  ctx.font = font(size, 4.4);
  ctx.fillStyle = ready ? colors.ink : colors.muted;
  ctx.fillText(
    'SPIN IT!',
    (size * (sb.x + sb.w / 2)) / GRID,
    (size * (sb.y + sb.h / 2)) / GRID,
    (size * (sb.w - 3)) / GRID,
  );
  plot(colors.cocoa, 38, 20, 22, 11);
  plot(colors.night, 39, 21, 20, 9);
  ctx.font = font(size, 3.4);
  ctx.fillStyle = colors.glow;
  const [line1, line2] = testBoardLines(report);
  ctx.fillText(line1, (size * 49) / GRID, (size * 23.6) / GRID, (size * 19) / GRID);
  ctx.fillText(line2, (size * 49) / GRID, (size * 27.6) / GRID, (size * 19) / GRID);
}
