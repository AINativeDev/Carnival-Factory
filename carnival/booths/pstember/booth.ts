/**
 * The North Pole Parcel Depot: the square itself, and the order its parts are
 * painted in, back to front, so nearer things cover farther ones. Each part
 * lives in its own file, named for what it is in the scene.
 */
import { iso, scene } from '../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { theme } from '../../../src/northpole/theme';
import type { Ctx } from './brush';
import { elves } from './elves';
import { gate } from './gate';
import { paddock } from './paddock';
import { santa } from './santa';
import { parcelStack, sleigh } from './sleigh';
import { flake, lanternAt, phase, waveAngle } from './timing';

const { colors } = theme;

/** How many snowflakes fall over the depot. */
const FLAKES = 28;

function paint(ctx: Ctx, time: number) {
  const t = phase(time);

  paddock(ctx, t);
  parcelStack(ctx, t);
  sleigh(ctx, t);
  elves(ctx, t);

  // The gate, and Santa beside it.
  const santaAt = iso(12, 21);
  santa(ctx, santaAt.x, santaAt.y, waveAngle(t));
  gate(ctx, lanternAt(t));

  // Snow falls over everything.
  ctx.fillStyle = colors.snow;
  for (let n = 0; n < FLAKES; n++) {
    const f = flake(n, t);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The depot's square on the map: a long, low shed with a flat gold roof. */
const booth: NorthPoleSquare = {
  id: 'pstember',
  name: 'North Pole Parcel Depot',
  description:
    'Santa waves at the gate while elves load parcels onto a sleigh and the reindeer graze.',
  stall: { shape: 'shed', roof: 'gold' },
  draw(ctx, size, time) {
    scene(ctx, size, time, paint);
  },
};

export default booth;
