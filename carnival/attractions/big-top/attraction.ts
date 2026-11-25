import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { box, drum, glow, iso, scene, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { acrobat, drumRoll, juggler, springboard, standingElf } from './performers';
import {
  acrobatAt,
  BOARD,
  drumBeats,
  FINALE,
  finaleGlow,
  OPENING,
  RING,
  spotlightOn,
  tapped,
  type Show,
} from './show';

const { colors } = theme;

/** The show so far: the attraction's one memory of the pointer, kept to three numbers. */
let show: Show = OPENING;

/** The tent's two back walls, in red and white stripes, with lantern lights along their tops. */
function tentWalls(ctx: CanvasRenderingContext2D, time: number) {
  const panel = 5.5;
  for (let i = 0; i < 8; i++) {
    const [top, side] = i % 2 ? [colors.snow, colors.snowShade] : [colors.berry, colors.berry];
    box(ctx, -22, -22 + i * panel, 2, panel, 30, top, side, colors.night);
    box(ctx, -22 + i * panel, -22, panel, 2, 30, top, side, colors.night);
  }
  const along = Array.from({ length: 9 }, (_, i) => -20 + i * 5.25);
  stringLights(
    ctx,
    along.map((a) => iso(-20, a, 27)),
    [colors.lantern, colors.gold],
    time,
  );
  stringLights(
    ctx,
    along.map((a) => iso(a, -20, 27)),
    [colors.lantern, colors.gold],
    time,
  );
}

/** The spotlight: a soft beam from the top of the tent onto a pool of light on the ring. */
function spotlight(ctx: CanvasRenderingContext2D, spot: { x: number; y: number }) {
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.moveTo(50, 6);
  ctx.lineTo(spot.x + 9, spot.y);
  ctx.lineTo(spot.x - 9, spot.y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(spot.x, spot.y, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The big finish: a warm glow over the ring and gold stars drifting up, fading in and out. */
function bigFinish(ctx: CanvasRenderingContext2D, since: number) {
  const bright = finaleGlow(since);
  if (bright <= 0) return;
  glow(ctx, RING.x, RING.y - 12, 40, bright * 0.8);
  ctx.fillStyle = colors.gold;
  ctx.globalAlpha = bright;
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 5 + Math.sin(since / 400 + i) * 1.5;
    const y = RING.y - 6 - (since / FINALE) * 36 - (i % 3) * 6;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Santa's Big Top, inside: a circus ring under the striped tent. A tap sends
 * the acrobat elf off the springboard and beats the drum roll, every fifth tap
 * is a big finish, two elves keep juggling and the spotlight follows the pointer.
 */
const attraction: NorthPoleSquare = {
  id: 'big-top',
  name: "Santa's Big Top",
  description: 'A circus show under the striped big top: tap to send the acrobat elf flying.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'tent', roof: 'berry', trim: 'snow', landmark: 'big-top' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    show = tapped(show, pointer?.presses ?? 0, time);
    const finale = finaleGlow(time - show.finale);
    scene(ctx, size, time, () => {
      tentWalls(ctx, time);
      // The ring: a low striped curb with sawdust inside.
      drum(ctx, RING.x, RING.y + 3, RING.rx, 3, [colors.berry, colors.snow], 10, 0.1, colors.cream);
      spotlight(ctx, spotlightOn(pointer, size, time));
      juggler(ctx, 44, 61, time, finale * 6);
      juggler(ctx, 57, 61, time + 400, finale * 6);
      const since = time - show.leapt;
      springboard(ctx, BOARD.x, BOARD.y, since >= 0 && since < 300 ? 1 - since / 300 : 0);
      const flying = acrobatAt(since);
      if (flying) acrobat(ctx, flying.x, flying.y, flying.turn);
      else standingElf(ctx, BOARD.x - 4, BOARD.y);
      drumRoll(ctx, 80, 66, drumBeats(show), since >= 0 && since < 200 ? 1 - since / 200 : 0);
      bigFinish(ctx, time - show.finale);
    });
  },
};

export default attraction;
