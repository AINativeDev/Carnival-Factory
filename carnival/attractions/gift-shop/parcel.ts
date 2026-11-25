/** A parcel in the shop, drawn in the diorama's ground units: its paper, its ribbon and its bow. */
import { box, iso } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { type Ctx, front, outline } from './shopfront';
import { bowOf, paperOf, ribbonOf, type Bow, type Parcel } from './wrapping';

const { colors } = theme;

/** How a parcel looks: its paper, and the ribbon and bow once they're on. */
export interface Look {
  paper: string;
  ribbon?: string;
  bow?: Bow;
}

/** Where a parcel stands: its north corner at (gx, gy), `z` up, `s` along each side. */
export interface Place {
  gx: number;
  gy: number;
  z: number;
  s: number;
}

/** A bow at (x, y), `k` times its size on a shelf parcel: on top of a parcel, or on a swatch. */
export function bowOn(ctx: Ctx, kind: Bow, x: number, y: number, k: number, ribbon: string) {
  ctx.fillStyle = ribbon;
  ctx.beginPath();
  if (kind === 'loops') {
    ctx.ellipse(x - k, y - 0.3 * k, 1.1 * k, 0.7 * k, 0.3, 0, Math.PI * 2);
    ctx.ellipse(x + k, y - 0.3 * k, 1.1 * k, 0.7 * k, -0.3, 0, Math.PI * 2);
  } else if (kind === 'rosette') {
    ctx.arc(x, y - 0.6 * k, 1.2 * k, 0, Math.PI * 2);
  } else if (kind === 'star') {
    for (let n = 0; n < 10; n++) {
      const r = (n % 2 ? 0.6 : 1.5) * k;
      const a = (n * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(x + r * Math.cos(a), y - 0.8 * k + r * Math.sin(a));
    }
  } else {
    // A holly sprig: two leaves and a berry, whatever the ribbon.
    ctx.fillStyle = colors.pine;
    ctx.ellipse(x - 0.8 * k, y - 0.3 * k, 1.1 * k, 0.5 * k, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 0.8 * k, y - 0.3 * k, 1.1 * k, 0.5 * k, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.arc(x, y - 0.5 * k, 0.6 * k, 0, Math.PI * 2);
  }
  ctx.fill();
  if (kind === 'rosette') {
    ctx.fillStyle = colors.snowLit;
    ctx.beginPath();
    ctx.arc(x, y - 0.6 * k, 0.45 * k, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A parcel at `place`, lit from the upper left: its paper, then its ribbon round it, then its bow. */
export function parcel(ctx: Ctx, { gx, gy, z, s }: Place, look: Look) {
  const tall = s * 0.8;
  box(ctx, gx, gy, s, s, tall, look.paper, look.paper, colors.shadow, z);
  // The right side in shade, the paper's colour still showing through.
  ctx.fillStyle = look.paper;
  ctx.globalAlpha = 0.45;
  outline(ctx, [
    iso(gx + s, gy, z),
    iso(gx + s, gy + s, z),
    iso(gx + s, gy + s, z + tall),
    iso(gx + s, gy, z + tall),
  ]);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (!look.ribbon) return;
  const band = s * 0.1;
  const [mx, my] = [gx + s / 2, gy + s / 2];
  const top = z + tall;
  ctx.fillStyle = look.ribbon;
  front(ctx, mx - band, mx + band, gy + s, z, top);
  ctx.fill();
  outline(ctx, [
    iso(mx - band, gy, top),
    iso(mx + band, gy, top),
    iso(mx + band, gy + s, top),
    iso(mx - band, gy + s, top),
  ]);
  ctx.fill();
  outline(ctx, [
    iso(gx, my - band, top),
    iso(gx + s, my - band, top),
    iso(gx + s, my + band, top),
    iso(gx, my + band, top),
  ]);
  ctx.fill();
  if (!look.bow) return;
  const at = iso(mx, my, top);
  bowOn(ctx, look.bow, at.x, at.y, s / 4, look.ribbon);
}

/** How a parcel on the shelf looks, from the picks it was wrapped with. */
export const lookOf = ({ paper, ribbon, bow }: Parcel): Look => ({
  paper: paperOf(paper),
  ribbon: ribbonOf(ribbon),
  bow: bowOf(bow),
});
