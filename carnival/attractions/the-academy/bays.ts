/**
 * Each bay's own furniture, the stations as places, in the bay's own 0 to
 * 100 units: the entrance's podium and chalkboard; the writing desk under
 * the Your booth form; the elf's desk; the implement loop's workbench; the
 * checks' test mat; code review's easel; the auto-merge gate's posts and
 * lintel; and the big doors onto the map. Only what stands still is here:
 * the people and what they do are in the scenes.
 */
import { pine } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { block, chalkboard, form, mat, pad, podium } from './props';

const { colors } = theme;

/** Where each bay's window and hanging lamp are along it, if it has them. */
export const BAY_LIGHTS: readonly { pane?: number; lamp?: number }[] = [
  { pane: 68, lamp: 50 },
  { pane: 70, lamp: 46 },
  { pane: 7, lamp: 86 },
  { pane: 7, lamp: 52 },
  { pane: 7 },
  { pane: 76, lamp: 18 },
  {},
  {},
];

/** Where the gate's posts stand, and its lintel's height, in bay 6. */
export const GATE = { left: 9, right: 44, top: 29 };

/** The gate's two posts and the lintel its seven lamps hang from. */
function gateFrame(ctx: CanvasRenderingContext2D) {
  const post = { w: 3, d: 3, h: 40 };
  block(ctx, GATE.left + 1.5, 71, post);
  block(ctx, GATE.right + 1.5, 71, post);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(GATE.left - 3, GATE.top - 2.4, GATE.right - GATE.left + 9, 1.6);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(GATE.left - 3, GATE.top - 0.8, GATE.right - GATE.left + 9, 3);
}

/** The big doors onto the map in bay 7, open on the dusk outside. */
function doors(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(27, 22, 50, 25);
  const sky = ctx.createLinearGradient(0, 23, 0, 47);
  sky.addColorStop(0, colors.dusk);
  sky.addColorStop(0.6, colors.duskLow);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(29, 23.5, 46, 23.5);
  ctx.fillStyle = colors.mountainFar;
  ctx.beginPath();
  ctx.moveTo(29, 41);
  ctx.lineTo(40, 33);
  ctx.lineTo(50, 39);
  ctx.lineTo(61, 31);
  ctx.lineTo(75, 40);
  ctx.lineTo(75, 47);
  ctx.lineTo(29, 47);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.fillRect(29, 42.5, 46, 4.5);
  pine(ctx, 34, 45, 8);
  pine(ctx, 70, 45, 9);
  ctx.fillStyle = colors.cocoa;
  for (const x of [22, 77]) ctx.fillRect(x, 22, 5, 25);
}

/** Bay `bay`'s furniture, standing still. */
export function bayDecor(ctx: CanvasRenderingContext2D, bay: number) {
  switch (bay) {
    case 0: {
      chalkboard(ctx, 10);
      pine(ctx, 88, 70, 22);
      podium(ctx, 50, 71, 11);
      return;
    }
    case 1: {
      form(ctx, 12);
      block(ctx, 60, 74, { w: 24, d: 11, h: 9 });
      return;
    }
    case 2: {
      block(ctx, 88, 73, { w: 13, d: 7, h: 9 });
      // The elf's ink pad and a stack of requests waiting on the desk.
      pad(ctx, 80, 60.5, colors.berry);
      ctx.fillStyle = colors.snowLit;
      for (let n = 0; n < 3; n++) ctx.fillRect(86 - n * 0.3, 58.4 - n * 1.1, 6, 1);
      return;
    }
    case 3: {
      block(ctx, 68, 75, { w: 27, d: 8, h: 8 });
      return;
    }
    case 4: {
      mat(ctx, 67, 63, 27);
      return;
    }
    case 5: {
      ctx.strokeStyle = colors.wood;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(48, 70);
      ctx.lineTo(55, 50);
      ctx.moveTo(72, 70);
      ctx.lineTo(65, 50);
      ctx.stroke();
      return;
    }
    case 6: {
      gateFrame(ctx);
      return;
    }
    default: {
      doors(ctx);
      // The map's snow, inside the doors, for the booth to spring up on.
      block(
        ctx,
        60,
        64,
        { w: 18, d: 14, h: 3 },
        {
          top: colors.snowLit,
          left: colors.snow,
          right: colors.snowShade,
        },
      );
    }
  }
}
