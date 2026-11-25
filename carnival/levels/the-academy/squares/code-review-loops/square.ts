import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the lens takes to go once round the loop of pages, in milliseconds. */
export const LOOP = 8_000;

/** The pages round the loop: a pull request's changes, waiting for review. */
export const PAGES = 5;

/** How far round the loop the lens is at `time`, from 0 to 1. */
export const lensAt = (time: number) => (((time / LOOP) % 1) + 1) % 1;

/**
 * Which pages are reviewed at `time`: every page the lens has passed this
 * time round has its gold tick, and the ticks clear when a new round starts.
 */
export function reviewed(time: number): boolean[] {
  const round = lensAt(time) * PAGES;
  return Array.from({ length: PAGES }, (_, n) => n + 0.5 < round);
}

/** Where a spot `t` of the way round the loop is, in scene units: an ellipse on the table. */
function onLoop(t: number, z: number) {
  const angle = t * Math.PI * 2 - Math.PI / 2;
  return iso(Math.cos(angle) * 12, Math.sin(angle) * 12, z);
}

/** Code Review Loops: a magnifying glass going round a loop of pages, ticking each one it has read. */
const codeReviewLoops: NorthPoleSquare = {
  id: 'code-review-loops',
  name: 'Code Review Loops',
  description:
    'Add an agent reviewer to your pull requests, teach it your team’s conventions, and let each round build on the last.',
  stall: { shape: 'tent', roof: 'mint', trim: 'snow' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 48);
      box(ctx, -17, -17, 34, 34, 6, colors.wood, colors.gingerbread, colors.cocoa);
      // The loop's track, drawn as a ring on the table.
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const p = onLoop(k / 40, 6.2);
        if (k) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // The pages round it, each with its lines, and a tick once the lens has read it.
      const ticks = reviewed(time);
      ticks.forEach((done, n) => {
        const page = onLoop((n + 0.5) / PAGES, 9);
        ctx.fillStyle = colors.cream;
        ctx.fillRect(page.x - 3, page.y - 4, 6, 7);
        ctx.fillStyle = colors.muted;
        for (let line = 0; line < 3; line++)
          ctx.fillRect(page.x - 2, page.y - 3 + line * 2, 4, 0.6);
        if (!done) return;
        ctx.strokeStyle = colors.pine;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(page.x - 1.8, page.y + 0.5);
        ctx.lineTo(page.x - 0.4, page.y + 2);
        ctx.lineTo(page.x + 2.2, page.y - 1.6);
        ctx.stroke();
      });
      // The lens, going round.
      const lens = onLoop(lensAt(time), 18);
      glow(ctx, lens.x, lens.y, 10, 0.6);
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(lens.x, lens.y, 5, 0, Math.PI * 2);
      ctx.moveTo(lens.x + 3.6, lens.y + 3.6);
      ctx.lineTo(lens.x + 7.5, lens.y + 7.5);
      ctx.stroke();
      ctx.fillStyle = colors.ice;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(lens.x, lens.y, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  },
};

export default codeReviewLoops;
