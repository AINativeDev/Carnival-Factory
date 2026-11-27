/**
 * Icing Echo's notes on the house: each place drawn in its note's colour
 * (the mirror windows tinted, the door a candy cane of that colour, the roof's
 * big gumdrops and the round attic window), glowing as it's lit, with the
 * note's badge on it. A place with no note in play is plain icing.
 */
import type { Point } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { path } from './house';
import { badge, halo } from './notes';
import { SLOTS, TONE_COLOURS, type Fixture } from './slots';

const { colors } = theme;

/** How wide a mirror window is, in the scene's units. */
const MIRROR_R = 4.6;

/** What a mirror window shows inside: given its middle, its radius and which mirror it is. */
export type InMirror = (at: Point, r: number, mirror: number) => void;

/** A round window of `rx` by `ry`, its glass tinted `colour` (none for clear ice), and what it reflects. */
function pane(
  ctx: CanvasRenderingContext2D,
  p: Point,
  size: { rx: number; ry: number },
  colour: string | null,
  lit: number,
  reflect: () => void,
) {
  ctx.save();
  ctx.fillStyle = colors.ice;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, size.rx, size.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  if (colour) {
    ctx.globalAlpha = 0.55 + 0.4 * lit;
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  reflect();
  // Lit, the glass shines from inside.
  ctx.globalAlpha = 0.45 * lit;
  ctx.fillStyle = colors.snowLit;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = colour && lit > 0.3 ? colour : colors.snowLit;
  ctx.lineWidth = 0.9 + 0.9 * lit;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, size.rx, size.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** The door in the front wall, a candy cane of `colour` (or plain wood) with icing stripes. */
function door(ctx: CanvasRenderingContext2D, colour: string | null, lit: number) {
  ctx.fillStyle = colour ?? colors.wood;
  path(ctx, [
    [-3, 10, 0],
    [3, 10, 0],
    [3, 10, 12],
    [-3, 10, 12],
  ]);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 0.85 + 0.15 * lit;
  for (let z = 1.5; z < 12; z += 3.5) {
    path(ctx, [
      [-3, 10, z],
      [3, 10, z],
      [3, 10, z + 1.2],
      [-3, 10, z + 1.2],
    ]);
    ctx.fill();
  }
  // Lit, it glows from inside.
  ctx.globalAlpha = 0.4 * lit;
  ctx.fillStyle = colors.snowLit;
  path(ctx, [
    [-3, 10, 0],
    [3, 10, 0],
    [3, 10, 12],
    [-3, 10, 12],
  ]);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A big sugared gumdrop sitting on the roof in `colour`, or a little dollop of icing. */
function gumdrop(ctx: CanvasRenderingContext2D, p: Point, colour: string | null, lit: number) {
  const r = colour ? 4.2 * (1 + 0.15 * lit) : 2.4;
  ctx.fillStyle = colour ?? colors.snowLit;
  ctx.beginPath();
  ctx.arc(p.x, p.y + r * 0.45, r, Math.PI, 0);
  ctx.quadraticCurveTo(p.x + r, p.y + r * 0.8, p.x, p.y + r * 0.8);
  ctx.quadraticCurveTo(p.x - r, p.y + r * 0.8, p.x - r, p.y + r * 0.45);
  ctx.fill();
  if (!colour) return;
  ctx.globalAlpha = 0.35 * lit;
  ctx.fillStyle = colors.snowLit;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Sugar on top, catching the light from the upper left.
  ctx.fillStyle = colors.snowLit;
  for (const [dx, dy] of [
    [-2.2, -1.6],
    [-0.6, -2.9],
    [1.6, -2],
    [2.6, 0.2],
  ] as const) {
    ctx.fillRect(p.x + dx, p.y + dy, 0.55, 0.55);
  }
}

/** One place's fixture, holding note `note` (-1 for none), lit `lit`, reflecting what `inMirror` draws. */
function fixture(
  ctx: CanvasRenderingContext2D,
  kind: Fixture,
  p: Point,
  note: number,
  lit: number,
  reflect: () => void,
) {
  const colour = note < 0 ? null : (TONE_COLOURS.at(note) ?? colors.gold);
  if (colour) halo(ctx, p.x, p.y, 13, colour, lit);
  if (kind === 'pane') pane(ctx, p, { rx: MIRROR_R, ry: MIRROR_R * 1.2 }, colour, lit, reflect);
  else if (kind === 'attic') pane(ctx, p, { rx: 2.9, ry: 3.8 }, colour, lit, reflect);
  else if (kind === 'door') door(ctx, colour, lit);
  else gumdrop(ctx, p, colour, lit);
}

/**
 * Every place on the house: `noteAt(slot)` says which note sits there now
 * (-1 for none, or one the mirrors are carrying) and `lightOf(note)` how lit
 * it is. `between` draws over the fixtures and under the badges: the treats.
 */
export function fixtures(
  ctx: CanvasRenderingContext2D,
  noteAt: (slot: number) => number,
  lightOf: (note: number) => number,
  inMirror: InMirror,
  between: () => void,
) {
  SLOTS.forEach(({ at, fixture: kind, mirror }, slot) => {
    const note = noteAt(slot);
    const reflect = () => {
      if (mirror >= 0) inMirror(at, MIRROR_R, mirror);
    };
    fixture(ctx, kind, at, note, note < 0 ? 0 : lightOf(note), reflect);
  });
  between();
  SLOTS.forEach(({ at, fixture: kind }, slot) => {
    const note = noteAt(slot);
    const lift = kind === 'gumdrop' ? -0.6 : 0;
    if (note >= 0) badge(ctx, note, at.x, at.y + lift, lightOf(note));
  });
}

/**
 * A note the fun-house mirrors are carrying to its new place: a bubble of its
 * colour, stretched and squashed as fun-house mirrors do, `moving` from 0 to 1.
 */
export function travelling(
  ctx: CanvasRenderingContext2D,
  note: number,
  at: Point,
  moving: number,
  time: number,
) {
  const colour = TONE_COLOURS.at(note) ?? colors.gold;
  const stretch = Math.sin(time / 110) * 0.3 * moving;
  halo(ctx, at.x, at.y, 9, colour, 0.8 * moving);
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(1 + stretch, 1 - stretch);
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
  badge(ctx, note, at.x, at.y, 0.4);
}
