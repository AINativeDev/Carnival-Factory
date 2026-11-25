import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { cocoaStep, FRESH, hint, served, type Cocoa } from './cocoa';
import { drawCup, drawCupSteam, drawPour, drawUrn } from './cup';
import { drawBoard, drawHint } from './sign';

const { colors } = theme;

/**
 * The visitor's cup, the stand's one memory of the pointer. It lives as long as
 * the stand's sandboxed frame, which the map shares with the room inside and
 * restarts only on a reload or once nobody has drawn the stand for a while, so
 * stepping out and back in finds the same cup and count.
 */
let cup: Cocoa = FRESH;

/** Where the cup stands on the counter, in front of the hatch, and how far it slides once served. */
const CUP = { gx: 2, gy: 10, slide: 12 };

/** A strip along the stall's front, from gx0 to gx1 at gy, from z0 up to z1. */
function front(
  ctx: CanvasRenderingContext2D,
  gx0: number,
  gx1: number,
  gy: number,
  z0: number,
  z1: number,
) {
  const points = [iso(gx0, gy, z0), iso(gx1, gy, z0), iso(gx1, gy, z1), iso(gx0, gy, z1)];
  ctx.beginPath();
  points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/**
 * A hot cocoa stand where the visitor makes their own cup: hold to pour, tap
 * for the toppings, and the chalkboard counts the cups served since it opened.
 */
const attraction: NorthPoleSquare = {
  id: 'cocoa-stand',
  name: 'Hot Cocoa Stand',
  description: 'Make your own cocoa: hold to pour, tap for marshmallows, cream and a candy cane.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'kiosk', roof: 'cocoa', trim: 'cream', landmark: 'cocoa-hut' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    cup = cocoaStep(cup, time, pointer);
    scene(ctx, size, time, () => {
      const wall = 30;
      // The hut: a wooden stand, its open front facing the lower left.
      const c = iso(0, 0);
      shadow(ctx, c.x + 2, c.y + 4, 64);
      box(ctx, -15, -9, 30, 17, wall, colors.snow, colors.wood, colors.cocoa);
      // Planks along the front.
      ctx.strokeStyle = colors.cocoa;
      ctx.lineWidth = 0.35;
      for (let z = 4; z < wall; z += 4) {
        const a = iso(-15, 8, z);
        const b = iso(15, 8, z);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // The serving hatch, dark inside, with a lantern glowing warm.
      ctx.fillStyle = colors.ink;
      front(ctx, -12, 12, 8, 12, 25);
      ctx.fill();
      const lamp = iso(0, 8, 21);
      glow(ctx, lamp.x, lamp.y, 10, 0.75 + 0.25 * Math.sin(time / 1400));
      ctx.fillStyle = colors.lantern;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // The counter, with snow on it, standing out in front of the hatch.
      box(ctx, -15, 8, 30, 4, 12, colors.snowShade, colors.gingerbread, colors.wood);

      // The scalloped awning, sloping out over the counter.
      const stripes = 8;
      for (let i = 0; i < stripes; i++) {
        const gx0 = -16 + (32 * i) / stripes;
        const gx1 = gx0 + 32 / stripes;
        ctx.fillStyle = i % 2 ? colors.lantern : colors.berry;
        const points = [
          iso(gx0, 8, wall),
          iso(gx1, 8, wall),
          iso(gx1, 13, wall - 3),
          iso(gx0, 13, wall - 3),
        ];
        ctx.beginPath();
        points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.fill();
        const mid = iso((gx0 + gx1) / 2, 13, wall - 3);
        ctx.beginPath();
        ctx.ellipse(mid.x, mid.y, 2, 1.6, Math.atan2(1, 2), 0, Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = colors.snow;
      front(ctx, -16, 16, 8, wall, wall + 1.5);
      ctx.fill();

      // The sign on the roof, three cocoa drops on gold.
      box(ctx, -9, -1, 18, 1.2, 8, colors.gold, colors.gold, colors.wood, wall);
      ctx.fillStyle = colors.cocoa;
      for (let i = 0; i < 3; i++) {
        const p = iso(-5 + i * 5, 0.2, wall + 4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // The visitor's cup under the urn's spout, sliding away once it's served.
      const away = served(cup, time);
      const spot = iso(CUP.gx, CUP.gy, 12);
      const at = iso(CUP.gx + away * CUP.slide, CUP.gy, 12);
      drawUrn(ctx, spot.x, spot.y);
      drawCup(ctx, at.x, at.y, cup, time, 1 - away);
      if (pointer?.down && cup.fill < 1) drawPour(ctx, spot.x, spot.y, cup.fill);
      if (cup.fill === 1 && away === 0) drawCupSteam(ctx, at.x, at.y, time);

      drawBoard(ctx, cup.served);
      drawHint(ctx, hint(cup));
    });
  },
};

export default attraction;
