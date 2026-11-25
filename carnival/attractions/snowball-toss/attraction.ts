import type { NorthPoleSquare } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { advance, flightOf, type Game, newGame, SHELVES, snowmanX, topple } from './game';
import { scoreboard } from './scoreboard';

const { colors } = theme;

let game: Game | undefined;

function snowman(ctx: CanvasRenderingContext2D, x: number, y: number, u: number) {
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.arc(x, y + 3 * u, 4 * u, 0, Math.PI * 2);
  ctx.arc(x, y - 3 * u, 3 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 0.6 * u;
  ctx.stroke();
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 3 * u, y - 7 * u, 6 * u, 1 * u);
  ctx.fillRect(x - 2 * u, y - 10 * u, 4 * u, 3 * u);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(x, y - 3.5 * u, 2 * u, 0.8 * u);
}

/** The booth: two back walls meeting behind, a lamp in the corner, and striped awnings. */
function booth(ctx: CanvasRenderingContext2D, wall: number) {
  shadow(ctx, 53, 70, 80);
  box(ctx, -21, -21, 3, 40, wall, colors.slab, colors.surface, colors.night);
  box(ctx, -21, -21, 40, 3, wall, colors.slab, colors.surface, colors.night);
  const lamp = iso(-17, -17, 24);
  glow(ctx, lamp.x, lamp.y, 24, 0.8);
  ctx.fillStyle = colors.lantern;
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 1.4, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [0, 1]) {
    for (let i = 0; i < 7; i++) {
      const a0 = -18 + i * 5.3;
      const a1 = a0 + 5.3;
      // Along one wall or the other: `a` runs along it, out from it to the front.
      const p = (a: number, out: number, z: number) =>
        side ? iso(-18 + out, a, z) : iso(a, -18 + out, z);
      ctx.fillStyle = i % 2 ? colors.snow : colors.pine;
      const points = [p(a0, 0, wall), p(a1, 0, wall), p(a1, 6, wall - 5), p(a0, 6, wall - 5)];
      ctx.beginPath();
      points.forEach((q, n) => (n ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.fill();
    }
  }
}

/** Candy-cane prizes hanging from the awning, swaying gently. */
function prizes(ctx: CanvasRenderingContext2D, wall: number, time: number) {
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 1.3;
  for (const [n, hook] of [iso(-16, 12, wall - 6), iso(12, -16, wall - 6)].entries()) {
    const sway = Math.sin(time / 600 + n * 40) * 1.6;
    ctx.beginPath();
    ctx.moveTo(hook.x + sway, hook.y + 11);
    ctx.lineTo(hook.x, hook.y);
    ctx.arc(hook.x - 2.2, hook.y, 2.2, 0, Math.PI, true);
    ctx.stroke();
  }
}

/** The three gingerbread shelves, each with its tin snowman sliding along it, tipping over when hit. */
function shelves(ctx: CanvasRenderingContext2D, state: Game, time: number) {
  const s = 0.8;
  for (const [n, shelf] of SHELVES.entries()) {
    const half = shelf.swing + 6;
    ctx.fillStyle = colors.wood;
    ctx.fillRect(50 - half, shelf.y + 1, half * 2, 2);
    ctx.fillStyle = colors.gingerbread;
    ctx.fillRect(50 - half, shelf.y, half * 2, 1.2);
    const tip = topple(state, n, time);
    ctx.save();
    // It tips over backwards about its feet, and fades as it lies down.
    ctx.translate(snowmanX(n, time), shelf.y);
    ctx.rotate((tip * Math.PI) / 2);
    ctx.globalAlpha = 1 - tip * 0.6;
    snowman(ctx, 0, -5.6, s);
    ctx.restore();
  }
}

/** A snowball toss game: tap to throw snowballs at the tin snowmen sliding along the shelves. */
const attraction: NorthPoleSquare = {
  id: 'snowball-toss',
  name: 'Snowball Toss',
  description: 'Throw snowballs at the sliding tin snowmen and beat your best score.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'stall', roof: 'pine', trim: 'snow', landmark: 'game-stall' },
  draw(ctx, size, time, pointer) {
    const state = advance(game ?? newGame(time), time, pointer, size);
    game = state;
    scene(ctx, size, time, () => {
      const wall = 34;
      booth(ctx, wall);
      shelves(ctx, state, time);
      prizes(ctx, wall, time);
      // The counter at the front, with snow on it.
      box(ctx, -21, 17, 30, 4, 6, colors.snowShade, colors.gingerbread, colors.wood);
      ctx.fillStyle = colors.snowLit;
      ctx.strokeStyle = colors.snowShade;
      ctx.lineWidth = 0.6;
      for (const ball of state.throws) {
        const at = flightOf(ball, time);
        if (!at) continue;
        // It shrinks a little as it flies away into the booth.
        const r = 3 - ((time - ball.at) / 600) * 1.4;
        ctx.beginPath();
        ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      scoreboard(ctx, state);
    });
  },
};

export default attraction;
