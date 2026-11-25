/**
 * The four elves behind the belt: the sorter with a magnifying glass, the
 * hammerer and the painter, busy while a toy passes them, and the checker
 * with a clipboard.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import { HAMMER_X, PAINT_X, PLACES, placeOf, type Letter } from './letters';

const { colors } = theme;

/**
 * An elf standing behind the belt, `x` across, with a pointed hat. `reach`
 * draws its working arm out to a point, which the caller draws the tool at.
 */
function elf(ctx: Ctx, u: number, x: number, reach: { x: number; y: number }) {
  ctx.fillStyle = colors.pine;
  ctx.fillRect((x - 3.5) * u, 57 * u, 7 * u, 10 * u);
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 1.8 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo((x + 2.5) * u, 59 * u);
  ctx.lineTo(reach.x * u, reach.y * u);
  ctx.stroke();
  ctx.fillStyle = colors.glow;
  circle(ctx, x * u, 53.5 * u, 3.2 * u);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo((x - 3.4) * u, 52 * u);
  ctx.lineTo((x + 3.4) * u, 52 * u);
  ctx.lineTo((x + 2) * u, 44 * u);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  circle(ctx, (x + 2) * u, 44 * u, 1.1 * u);
  ctx.fillRect((x - 3.6) * u, 51 * u, 7.2 * u, 1.6 * u);
}

/** Every elf at work at `time`, given the `letters` in the factory then. */
export function drawElves(ctx: Ctx, u: number, time: number, letters: readonly Letter[]) {
  const near = (x: number) =>
    letters.some((l) => l.stage === 'belt' && Math.abs(placeOf(l).x - x) < 4);

  // The sorting elf, looking letters over with a magnifying glass.
  const sorting = letters.find((l) => l.stage === 'sort');
  const glass = sorting
    ? { x: PLACES.sort.x + Math.sin(sorting.progress * Math.PI * 3) * 2, y: 57 }
    : { x: 25, y: 59 };
  elf(ctx, u, 21, glass);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.8 * u;
  ctx.beginPath();
  ctx.arc(glass.x * u, (glass.y - 2) * u, 2.2 * u, 0, Math.PI * 2);
  ctx.stroke();

  // The hammering elf and the painting elf, busy while a toy passes.
  const swing = near(HAMMER_X) ? Math.sin(time / 110) : 0;
  const hammer = { x: HAMMER_X + 3, y: 57 + swing * 2.5 };
  elf(ctx, u, HAMMER_X - 2, hammer);
  ctx.fillStyle = colors.muted;
  ctx.fillRect((hammer.x - 1) * u, (hammer.y - 2.5) * u, 2.4 * u, 1.6 * u);
  const stroke = near(PAINT_X) ? Math.sin(time / 160) : 0;
  const brush = { x: PAINT_X + 3 + stroke * 1.5, y: 58 };
  elf(ctx, u, PAINT_X - 2, brush);
  ctx.fillStyle = colors.violet;
  circle(ctx, brush.x * u, (brush.y + 1) * u, 0.9 * u);

  // The checking elf, with a clipboard.
  elf(ctx, u, 79, { x: 84, y: 60 });
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(82.5 * u, 56 * u, 4 * u, 5 * u);
  ctx.fillStyle = colors.muted;
  ctx.fillRect(83.2 * u, 57.3 * u, 2.6 * u, 0.5 * u);
  ctx.fillRect(83.2 * u, 58.8 * u, 2.6 * u, 0.5 * u);
}
