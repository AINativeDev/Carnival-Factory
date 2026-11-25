/**
 * A level's carousel: reindeer going round on poles under a striped canopy,
 * rising and falling as they go. The ones behind the centre pole are drawn
 * first, so the ones in front pass over them. One turn takes twelve seconds.
 */
import { bulb, middle, shadow, twinkle } from './brushes';
import { phase } from './elf';
import { theme } from './theme';
import type { Thing } from './world';

const { colors } = theme;

const RIDE = { rx: 46, ry: 22, deck: 8, poles: 38, canopy: 26, turn: 12000 };
const REINDEER = 6;

/** Where reindeer `n` is round the carousel: its angle, and how high it rides on its pole. */
export function reindeerAt(time: number, seed: number, n: number) {
  const angle = (phase(time, RIDE.turn, seed) + n / REINDEER) * Math.PI * 2;
  return { angle, bob: Math.sin(angle * 2 + n) * 4 };
}

/** One small reindeer on its pole, facing the way it goes round. */
function rider(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number, coat: string) {
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 1, y - 26, 2, 30);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-7, 2, 2, 5);
  ctx.fillRect(5, 2, 2, 5);
  ctx.beginPath();
  ctx.ellipse(10, -5, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.cocoa;
  ctx.beginPath();
  ctx.moveTo(9, -8);
  ctx.lineTo(7, -14);
  ctx.moveTo(11, -8);
  ctx.lineTo(13, -14);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.fillRect(-3, -5, 6, 2);
  ctx.restore();
}

/** Reindeer going round under a striped canopy, the canopy's rim strung with lights. */
export function drawCarousel(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 6, 54);
  // The deck: a low round platform, its side in shade.
  ctx.fillStyle = colors.slabShade;
  ctx.beginPath();
  ctx.ellipse(x, y, RIDE.rx + 4, RIDE.ry + 2, 0, 0, Math.PI);
  ctx.lineTo(x - RIDE.rx - 4, y - RIDE.deck);
  ctx.ellipse(x, y - RIDE.deck, RIDE.rx + 4, RIDE.ry + 2, 0, Math.PI, 0, true);
  ctx.fill();
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(x, y - RIDE.deck, RIDE.rx + 4, RIDE.ry + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  const coats = [colors.cocoa, colors.gingerbread, colors.wood];
  const riders = [...coats, ...coats].map((coat, n) => ({
    coat,
    ...reindeerAt(time, thing.seed, n),
  }));
  const ride = (front: boolean) => {
    for (const { coat, angle, bob } of riders) {
      if (Math.sin(angle) >= 0 !== front) continue;
      const rx = x + Math.cos(angle) * RIDE.rx * 0.8;
      const ry = y - RIDE.deck - 16 + Math.sin(angle) * RIDE.ry * 0.8 + bob;
      rider(ctx, rx, ry, Math.sin(angle) >= 0 ? -1 : 1, coat);
    }
  };
  ride(false);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 3, y - RIDE.deck - RIDE.poles - 10, 6, RIDE.poles + 10);
  ride(true);
  // The canopy: a striped cone over a scalloped rim.
  const rim = y - RIDE.deck - RIDE.poles - 8;
  const stripe = thing.seed > 0.5 ? colors.violet : colors.berry;
  const slices = 12;
  // The far half of the cone first, from the back round, then the near half over it.
  for (let m = 0; m < 2 * slices; m++) {
    const n = (m + slices) % (2 * slices);
    const a = (n / slices) * Math.PI;
    const b = ((n + 1) / slices) * Math.PI;
    ctx.fillStyle = n % 2 ? colors.snow : stripe;
    ctx.beginPath();
    ctx.moveTo(x, rim - RIDE.canopy);
    ctx.lineTo(x + Math.cos(a) * RIDE.rx, rim + Math.sin(a) * RIDE.ry);
    ctx.lineTo(x + Math.cos(b) * RIDE.rx, rim + Math.sin(b) * RIDE.ry);
    ctx.fill();
  }
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(x, rim - RIDE.canopy);
  ctx.lineTo(x + RIDE.rx, rim);
  ctx.lineTo(x + RIDE.rx * 0.3, rim + RIDE.ry);
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let n = 0; n <= slices; n++) {
    const a = (n / slices) * Math.PI;
    bulb(
      ctx,
      x + Math.cos(a) * RIDE.rx,
      rim + Math.sin(a) * RIDE.ry + 2,
      colors.lantern,
      twinkle(time, n + thing.seed * 10),
    );
  }
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(x, rim - RIDE.canopy - 3, 4, 0, Math.PI * 2);
  ctx.fill();
}
