import type { NorthPoleSquare } from '../../northpole/square';
import { theme } from '../../northpole/theme';

const { colors } = theme;

/** How long the gumdrop lights take to run once along the roof, in milliseconds. */
export const CHASE = 1_800;

/**
 * Whether gumdrop light `light` of `count` is lit at `time`. A dark gap runs
 * along the string once every `CHASE`, so the lights look like they chase.
 */
export function gumdropLit(light: number, count: number, time: number): boolean {
  const dark = Math.floor(((time % CHASE) / CHASE) * count);
  return light % count !== dark && (light + 1) % count !== dark;
}

const GUMDROPS = [colors.berry, colors.mint, colors.gold, colors.violet];

/** A gingerbread fun house with icing trim, a wobbly mirror window and gumdrop lights blinking on and off. */
const attraction: NorthPoleSquare = {
  id: 'gingerbread-fun-house',
  name: 'Gingerbread Fun House',
  description: 'A crooked gingerbread house with gumdrop lights and a wobbly mirror.',
  draw(ctx, size, time) {
    const u = size / 100;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 0, size, size);

    // The house leans a little, as a fun house should.
    ctx.save();
    ctx.translate(50 * u, 88 * u);
    ctx.rotate(Math.sin(time / 1500) * 0.03 - 0.03);
    ctx.translate(-50 * u, -88 * u);

    ctx.fillStyle = colors.gingerbread;
    ctx.fillRect(20 * u, 44 * u, 60 * u, 44 * u);

    // The roof, thick with icing.
    ctx.fillStyle = colors.cocoa;
    ctx.beginPath();
    ctx.moveTo(12 * u, 46 * u);
    ctx.lineTo(50 * u, 14 * u);
    ctx.lineTo(88 * u, 46 * u);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = 3 * u;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.lineWidth = 1.5 * u;
    ctx.beginPath();
    for (let x = 22; x <= 78; x += 7) {
      ctx.moveTo(x * u, 50 * u);
      ctx.arc((x + 3.5) * u, 50 * u, 3.5 * u, Math.PI, 0, true);
    }
    ctx.stroke();

    // Gumdrop lights along the roof, chasing each other.
    const lights = 9;
    for (let i = 0; i < lights; i++) {
      const t = i / (lights - 1);
      const x = 14 + t * 72;
      const y = 46 - (1 - Math.abs(t * 2 - 1)) * 30;
      ctx.globalAlpha = gumdropLit(i, lights, time) ? 1 : 0.25;
      ctx.fillStyle = GUMDROPS[i % GUMDROPS.length];
      ctx.beginPath();
      ctx.arc(x * u, (y - 1) * u, 2.6 * u, Math.PI, 0);
      ctx.lineTo((x + 2.6) * u, (y + 1) * u);
      ctx.lineTo((x - 2.6) * u, (y + 1) * u);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // A candy-cane door.
    ctx.fillStyle = colors.berry;
    ctx.fillRect(43 * u, 66 * u, 14 * u, 22 * u);
    ctx.fillStyle = colors.snow;
    for (let y = 68; y < 88; y += 5) ctx.fillRect(43 * u, y * u, 14 * u, 2 * u);

    // The wobbly mirror window: a circle that stretches and squashes.
    const wobble = Math.sin(time / 400);
    ctx.fillStyle = colors.ice;
    ctx.beginPath();
    ctx.ellipse(30 * u, 62 * u, (6 + wobble * 1.5) * u, (6 - wobble * 1.5) * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(70 * u, 62 * u, (6 - wobble * 1.5) * u, (6 + wobble * 1.5) * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.snow;
    ctx.stroke();

    ctx.restore();
  },
};

export default attraction;
