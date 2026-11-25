import type { NorthPoleSquare } from '../../../northpole/square';
import { box, glow, iso, scene, shadow } from '../../../northpole/diorama';
import { canvasFont, theme } from '../../../northpole/theme';

const { colors } = theme;

/** The repository the gifts install from. */
export const GIFT_SOURCE = 'github:AINativeDev/Northpole-Carnival-Factory';

/**
 * The gifts on the shelves: the skills in `plugins/north-pole-gifts/`, each
 * with what it does and the colour of its wrapping.
 */
export const GIFTS = [
  {
    skill: 'stocking-stuffer',
    name: 'Stocking stuffer',
    does: 'Bumps one outdated dependency a week',
    wrap: colors.berry,
  },
  {
    skill: 'tidy-elf',
    name: 'Tidy elf',
    does: "Lists the README's broken commands and links",
    wrap: colors.pine,
  },
  {
    skill: 'gift-tag',
    name: 'Gift tag',
    does: 'Labels new issues, asks when one is vague',
    wrap: colors.violet,
  },
  {
    skill: 'snow-plough',
    name: 'Snow plough',
    does: 'Lists stale branches and drafts, deletes nothing',
    wrap: colors.ice,
  },
  {
    skill: 'wrapping-paper',
    name: 'Wrapping paper',
    does: 'Drafts release notes since the last tag',
    wrap: colors.gold,
  },
] as const;

/** How long the shop keeps each gift in the spotlight, in milliseconds. */
export const SHOW = 4_000;

/** Which gift is in the spotlight at `time`: each in turn, for `SHOW` each. */
export function inSpotlight(time: number): number {
  const turn = Math.floor(time / SHOW) % GIFTS.length;
  return (turn + GIFTS.length) % GIFTS.length;
}

/** The one command that installs gift `skill` from this repository. */
export function installCommand(skill: string): string {
  return `tessl install ${GIFT_SOURCE} --skill ${skill}`;
}

/** Where each gift sits in the window, along the front and up: three on the top shelf, two below. */
const PLACES = [
  [-14, 12],
  [-7, 12],
  [0, 12],
  [-10.5, 5],
  [-3.5, 5],
] as const;

type Ctx = CanvasRenderingContext2D;

/** The shop's front wall faces the lower left, at this gy, and stands this tall. */
const FRONT = 2;
const WALL = 28;

/** Words in the theme's font at (x, y), `height` units tall and no wider than `width`. */
function words(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  height: number,
  width: number,
  weight: 'normal' | 'bold' = 'normal',
) {
  ctx.save();
  ctx.font = canvasFont('title', weight);
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}

/** A strip along the shop's front, from gx0 to gx1 at gy, from z0 up to z1. */
function front(ctx: Ctx, gx0: number, gx1: number, gy: number, z0: number, z1: number) {
  const points = [iso(gx0, gy, z0), iso(gx1, gy, z0), iso(gx1, gy, z1), iso(gx0, gy, z1)];
  ctx.beginPath();
  points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/** A wrapped box on the shelf at (gx, z) in the window, with a ribbon and a bow. */
function gift(ctx: Ctx, gx: number, z: number, wrap: string) {
  box(ctx, gx, FRONT - 2, 4, 2, 4, wrap, wrap, colors.shadow, z);
  // The ribbon, round its front and over its top.
  ctx.fillStyle = colors.snowLit;
  front(ctx, gx + 1.6, gx + 2.4, FRONT, z, z + 4);
  ctx.fill();
  const bow = iso(gx + 2, FRONT - 1, z + 4.6);
  ctx.beginPath();
  ctx.ellipse(bow.x - 1, bow.y, 1.1, 0.7, 0, 0, Math.PI * 2);
  ctx.ellipse(bow.x + 1, bow.y, 1.1, 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A gift shop whose shelves hold the North Pole's gift skills, each in the spotlight in turn. */
const attraction: NorthPoleSquare = {
  id: 'gift-shop',
  name: 'Gift Shop',
  description:
    'Five small factory loops wrapped as gifts, each installable on your own repository with one command.',
  draw(ctx, size, time) {
    const shown = inSpotlight(time);
    const { skill, name, does, wrap } = GIFTS[shown];
    scene(ctx, size, time, () => {
      // The shop: a wooden hut, its shop window facing the lower left.
      const c = iso(-3, -6);
      shadow(ctx, c.x + 2, c.y + 4, 60);
      box(ctx, -20, -12, 30, 14, WALL, colors.snow, colors.wood, colors.cocoa);
      ctx.strokeStyle = colors.cocoa;
      ctx.lineWidth = 0.35;
      for (let z = 4; z < WALL; z += 4) {
        const a = iso(-20, FRONT, z);
        const b = iso(10, FRONT, z);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // The window, dark inside, with two shelves.
      ctx.fillStyle = colors.ink;
      front(ctx, -17, 7, FRONT, 3, 21);
      ctx.fill();
      ctx.fillStyle = colors.gingerbread;
      for (const z of [4, 11]) {
        front(ctx, -17, 7, FRONT, z, z + 1);
        ctx.fill();
      }

      // A warm pool of light on the gift in the spotlight, breathing slowly; it lifts a little.
      const [sx, sz] = PLACES[shown];
      const lit = iso(sx + 2, FRONT, sz + 2);
      glow(ctx, lit.x, lit.y, 10, 1.6 + 0.3 * Math.sin((time / SHOW) * Math.PI * 2));
      GIFTS.forEach((g, i) => {
        const [gx, z] = PLACES[i];
        const lift = i === shown ? 0.8 + 0.5 * Math.sin(time / 600) : 0;
        gift(ctx, gx, z + lift, g.wrap);
      });

      // The striped awning over the window, and snow along its edge.
      const stripes = 8;
      for (let i = 0; i < stripes; i++) {
        const gx0 = -20 + (30 * i) / stripes;
        const gx1 = gx0 + 30 / stripes;
        ctx.fillStyle = i % 2 ? colors.snowLit : colors.berry;
        const points = [
          iso(gx0, FRONT, WALL),
          iso(gx1, FRONT, WALL),
          iso(gx1, FRONT + 3, WALL - 2),
          iso(gx0, FRONT + 3, WALL - 2),
        ];
        ctx.beginPath();
        points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.fill();
      }
      ctx.fillStyle = colors.snow;
      front(ctx, -20, 10, FRONT, WALL, WALL + 1.5);
      ctx.fill();

      // The sign on the roof, gold, running along the front as the wall does.
      box(ctx, -15, -3, 20, 1.2, 7, colors.gold, colors.gold, colors.wood, WALL);
      const sign = iso(-5, -1.8, WALL + 3.5);
      ctx.save();
      ctx.translate(sign.x, sign.y);
      ctx.transform(1, 0.5, 0, 1, 0, 0);
      ctx.fillStyle = colors.cocoa;
      words(ctx, 'GIFT SHOP', 0, 0, 4.4, 18, 'bold');
      ctx.restore();

      // The gift tag in front of the shop: the gift's name, what it does and how to take it home.
      shadow(ctx, 47, 91, 40);
      ctx.fillStyle = colors.shadow;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(10.6, 77.6, 80, 19);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.cream;
      ctx.fillRect(10, 77, 80, 19);
      ctx.fillStyle = wrap;
      ctx.fillRect(10, 77, 2.5, 19);
      ctx.fillStyle = colors.ink;
      words(ctx, name, 51, 81.5, 4.6, 72, 'bold');
      words(ctx, does, 51, 87, 3.3, 72);
      ctx.fillStyle = colors.pineDark;
      words(ctx, installCommand(skill), 51, 92.3, 2.8, 74);
    });
  },
};

export default attraction;
