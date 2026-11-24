import type { NorthPoleSquare } from '../../northpole/square';
import { canvasFont, theme } from '../../northpole/theme';

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

/** Where each gift sits: three on the top shelf, two below. */
const PLACES = [
  [28, 42],
  [50, 42],
  [72, 42],
  [39, 56],
  [61, 56],
] as const;

type Ctx = CanvasRenderingContext2D;

/** Words in the theme's font, `height` units tall and no wider than `width`. */
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

/** A wrapped box standing on (x, y), with a ribbon round it and a bow on top. */
function gift(ctx: Ctx, x: number, y: number, u: number, wrap: string) {
  ctx.fillStyle = wrap;
  ctx.fillRect(x - 6 * u, y - 10 * u, 12 * u, 10 * u);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 1 * u, y - 10 * u, 2 * u, 10 * u);
  ctx.fillRect(x - 6 * u, y - 6 * u, 12 * u, 2 * u);
  ctx.beginPath();
  ctx.ellipse(x - 2 * u, y - 11 * u, 2.2 * u, 1.4 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 2 * u, y - 11 * u, 2.2 * u, 1.4 * u, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A gift shop whose shelves hold the North Pole's gift skills, each in the spotlight in turn. */
const attraction: NorthPoleSquare = {
  id: 'gift-shop',
  name: 'Gift Shop',
  description:
    'Five small factory loops wrapped as gifts, each installable on your own repository with one command.',
  draw(ctx, size, time) {
    const u = size / 100;
    const shown = inSpotlight(time);
    const { skill, name, does } = GIFTS[shown];

    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 80 * u, size, 20 * u);

    // The shop: a wooden front with a striped awning and a gold sign.
    ctx.fillStyle = colors.wood;
    ctx.fillRect(10 * u, 20 * u, 80 * u, 62 * u);
    ctx.fillStyle = colors.surface;
    ctx.fillRect(16 * u, 28 * u, 68 * u, 32 * u);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? colors.snow : colors.berry;
      ctx.fillRect((8 + i * 14) * u, 16 * u, 14 * u, 6 * u);
      ctx.beginPath();
      ctx.arc((15 + i * 14) * u, 22 * u, 7 * u, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = colors.gold;
    ctx.fillRect(26 * u, 4 * u, 48 * u, 10 * u);
    ctx.fillStyle = colors.cocoa;
    words(ctx, 'GIFT SHOP', 50 * u, 9.3 * u, 6.5 * u, 44 * u, 'bold');

    // A warm pool of light behind the gift in the spotlight, breathing slowly.
    const [sx, sy] = PLACES[shown];
    ctx.globalAlpha = 0.45 + 0.15 * Math.sin((time / SHOW) * Math.PI * 2);
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(sx * u, (sy - 6) * u, 9 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // The shelves, and the gifts on them. The one in the spotlight lifts a little.
    ctx.fillStyle = colors.gingerbread;
    ctx.fillRect(18 * u, 42 * u, 64 * u, 2 * u);
    ctx.fillRect(18 * u, 56 * u, 64 * u, 2 * u);
    GIFTS.forEach((g, i) => {
      const [x, y] = PLACES[i];
      const lift = i === shown ? 1.5 + Math.sin(time / 500) : 0;
      gift(ctx, x * u, (y - lift) * u, u, g.wrap);
    });

    // The gift tag on the counter: its name, what it does and how to take it home.
    ctx.fillStyle = colors.snowShade;
    ctx.fillRect(8 * u, 60 * u, 84 * u, 3 * u);
    ctx.fillStyle = colors.cream;
    ctx.fillRect(12 * u, 64 * u, 76 * u, 22 * u);
    ctx.fillStyle = GIFTS[shown].wrap;
    ctx.fillRect(12 * u, 64 * u, 3 * u, 22 * u);
    ctx.fillStyle = colors.ink;
    words(ctx, name, 51.5 * u, 69 * u, 5 * u, 70 * u, 'bold');
    words(ctx, does, 51.5 * u, 75.5 * u, 3.6 * u, 70 * u);
    ctx.fillStyle = colors.pineDark;
    words(ctx, installCommand(skill), 51.5 * u, 81.5 * u, 3 * u, 70 * u);
  },
};

export default attraction;
