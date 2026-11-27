/**
 * The Ferris Wheel, and its game, Boarding Time: elves queue on the boarding
 * deck at the wheel's foot, and a tap sends the next one into the car swinging
 * past the gate. Board the empty cars, let the full ones go, fill the wheel.
 */
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { box, glow, iso, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { HOP_IN, deck, offTheRide, queue } from './elves';
import { advance, newBoarding, type Boarding } from './game';
import { callouts, closedCard, firstHint, fullWheel, invitation, scoreboard } from './hud';
import { GATE, HUB, WINDOW, angleAt, baubleOf, carSpots, nearestCar, spinning } from './ride';
import { drawWheel } from './view';

const { colors } = theme;

/** The game, the attraction's one piece of state for the visit. */
let boarding: Boarding | undefined;

/** Two faint ribbons of northern lights rippling across the dusk. */
function aurora(ctx: CanvasRenderingContext2D, time: number) {
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [color, base, speed] of [
    [colors.aurora, 20, 1500],
    [colors.violet, 26, 2100],
  ] as const) {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let x = 0; x <= 100; x += 4) {
      const y = base + Math.sin(x / 14 + time / speed) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
}

/** A warm lamp on the snow at (gx, gy). */
function lamp(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  const foot = iso(gx, gy);
  glow(ctx, foot.x, foot.y - 10, 14, 0.85);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(foot.x - 0.5, foot.y - 12, 1, 12);
  ctx.fillStyle = colors.lantern;
  ctx.fillRect(foot.x - 1.4, foot.y - 15, 2.8, 3);
}

/**
 * The game and the wheel for this frame: the game moved on by the taps since
 * the last one, and how ready the gate is, from 0 to 1, as a car nears it.
 */
function play(time: number, pointer?: SquarePointer) {
  const game = advance(boarding ?? newBoarding(time, 0, 'demo'), time, pointer?.presses ?? 0);
  boarding = game;
  const angle = angleAt(game.wheel, time);
  const { car, off } = nearestCar(angle);
  const reach = Math.abs(off) / WINDOW;
  const still = spinning(game.wheel, time) || game.mode === 'over';
  const ready = still ? 0 : Math.max(0, Math.min(1, 1.6 - reach));
  return { game, angle, car, ready };
}

/** A ferris wheel hung with bauble cars, and a queue of elves to board them in time. */
const attraction: NorthPoleSquare = {
  id: 'ferris-wheel',
  name: 'Ferris Wheel',
  description:
    'Boarding Time: tap to send each elf into an empty car as it swings past the gate, fill the wheel and keep up as it speeds up.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'stall', roof: 'violet', trim: 'snow', landmark: 'big-wheel' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    const { game, angle, car, ready } = play(time, pointer);
    scene(ctx, size, time, () => {
      aurora(ctx, time);
      shadow(ctx, 52, 79, 60);
      box(ctx, -12, -9, 24, 18, 3, colors.slab, colors.surface, colors.night);
      lamp(ctx, -18, 6);
      const hopping = time - game.boarded.at < HOP_IN ? game.boarded.car : -1;
      drawWheel(ctx, angle, time, {
        cars: game.cars,
        hopping,
        ready,
        full: (game.cars.at(car) ?? 'empty') !== 'empty',
        cheer: Math.max(0, 1 - Math.abs((time - game.lapAt) / 1_400 - 1)),
      });
      deck(ctx);
      const hook = carSpots(angle).at(hopping < 0 ? car : hopping) ?? GATE;
      const crowd = {
        ...{ boardedAt: game.boarded.at, missedAt: game.missed.at, served: game.served },
        ...{ misses: game.mode === 'demo' ? 0 : game.misses, hops: game.hops },
      };
      queue(ctx, crowd, baubleOf(hook), time);
      offTheRide(ctx, crowd, GATE, time);
      callouts(ctx, game, time);
      firstHint(ctx, game, time);
      fullWheel(ctx, game, time);
      if (game.mode === 'demo') invitation(ctx, time);
      else scoreboard(ctx, game);
      if (game.mode === 'over') closedCard(ctx, game, time);
      // A soft spotlight on the hub while the wheel stands closed.
      if (game.mode === 'over') glow(ctx, HUB.x, HUB.y, 10, 0.4);
    });
  },
};

export default attraction;
