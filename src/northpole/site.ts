/**
 * The construction site on a spot held for a booth being built
 * (docs/specs/construction-sites.md): trampled snow, scaffolding with a plank
 * floor, a few crates, an elf at work, and a sign with `@login` and its stage.
 */
import { block, corners, diamond, middle, shadow } from './brushes';
import { drawPerson } from './people';
import { standing } from './stall-plan';
import { canvasFont, theme } from './theme';
import { toScreen, type Box, type Spot, type Tile } from './world';

const { colors } = theme;

/** A booth being built: who it's for, and how far along it is, already in words. */
export interface SiteLabel {
  login: string;
  stage: string;
}

/** The construction site's scaffolding height, and its sign's post and board, in world pixels. */
const SITE = { scaffold: 84, post: 34, w: 132, h: 44 };

/**
 * The construction site of a booth being built. The hammer swings gently with
 * `time`, so it stands still when the map passes 0, and the sign bounces while
 * the player stands at it. Returns where a click opens it.
 */
export function drawSite(
  ctx: CanvasRenderingContext2D,
  spot: Spot,
  label: SiteLabel,
  time: number,
  near = false,
): Box {
  const c = corners(spot);
  const { x, y } = middle(spot);
  shadow(ctx, x, y + 6, 70);
  // Trampled snow, roped off like an open spot.
  ctx.fillStyle = colors.snowShade;
  diamond(ctx, c, 0);
  ctx.fill();
  scaffolding(ctx, { x: spot.x + 0.3, y: spot.y + 0.2, w: spot.w - 0.75, h: spot.h - 0.75 });
  cratesAndElf(ctx, spot, time);
  // The sign on its post, at the front: who it's for and how far along it is.
  const foot = { x: (c.left.x + c.bottom.x) / 2, y: (c.left.y + c.bottom.y) / 2 + 4 };
  const top = siteSign(ctx, foot, label, near ? Math.abs(Math.sin(time / 180)) * 6 : 0);
  const { w } = SITE;
  const box = standing(spot, SITE.scaffold + 10);
  const left = Math.min(box.x, foot.x - w / 2 - 4);
  return {
    x: left,
    y: Math.min(box.y, top - 4),
    w: Math.max(box.x + box.w, foot.x + w / 2 + 4) - left,
    h: box.y + box.h - Math.min(box.y, top - 4),
  };
}

/** A wooden pole from `foot` up `height`. */
function pole(ctx: CanvasRenderingContext2D, foot: Tile, height: number) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(foot.x - 2, foot.y - height, 4, height);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x, foot.y - height, 2, height);
}

/** A plank from `a` to `b`, both `lift` above the ground. */
function plank(ctx: CanvasRenderingContext2D, a: Tile, b: Tile, lift: number) {
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y - lift);
  ctx.lineTo(b.x, b.y - lift);
  ctx.stroke();
}

/** The scaffolding over `inner`: its back, then its floor, then its front, and a brace across each front face. */
function scaffolding(ctx: CanvasRenderingContext2D, inner: Box) {
  const s = corners(inner);
  const { scaffold } = SITE;
  for (const foot of [s.left, s.top, s.right]) pole(ctx, foot, scaffold);
  for (const lift of [scaffold * 0.45, scaffold - 4]) {
    plank(ctx, s.left, s.top, lift);
    plank(ctx, s.top, s.right, lift);
  }
  ctx.fillStyle = colors.gingerbread;
  diamond(ctx, s, scaffold * 0.45);
  ctx.fill();
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 1;
  ctx.stroke();
  pole(ctx, s.bottom, scaffold);
  for (const lift of [scaffold * 0.45, scaffold - 4]) {
    plank(ctx, s.left, s.bottom, lift);
    plank(ctx, s.bottom, s.right, lift);
  }
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.left.x, s.left.y);
  ctx.lineTo(s.bottom.x, s.bottom.y - scaffold * 0.45);
  ctx.moveTo(s.bottom.x, s.bottom.y);
  ctx.lineTo(s.right.x, s.right.y - scaffold * 0.45);
  ctx.stroke();
}

/** Crates stacked by the front, and the elf at work beside them, swinging a hammer. */
function cratesAndElf(ctx: CanvasRenderingContext2D, spot: Spot, time: number) {
  const crate = (box: Box, lift = 0) => {
    block(ctx, box, 12, colors.gingerbread, colors.wood, colors.cocoa, lift);
  };
  crate({ x: spot.x + spot.w - 0.95, y: spot.y + 0.05, w: 0.4, h: 0.4 });
  crate({ x: spot.x + spot.w - 0.95, y: spot.y + 0.5, w: 0.4, h: 0.4 });
  crate({ x: spot.x + spot.w - 0.95, y: spot.y + 0.25, w: 0.4, h: 0.4 }, 12);
  const elf = { x: spot.x + spot.w - 0.75, y: spot.y + spot.h - 0.95 };
  drawPerson(ctx, elf, { coat: colors.pine, hat: colors.berry, scale: 0.8 }, -1, false, 0);
  const hand = toScreen(elf);
  const swing = -0.5 + 0.45 * Math.sin(time / 320);
  ctx.save();
  ctx.translate(hand.x - 4, hand.y - 18);
  ctx.rotate(swing);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-1.5, -14, 3, 14);
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(-5, -17, 10, 5);
  ctx.restore();
}

/** The site's sign on its post from `foot`, raised by `lift`; returns the top of its board. */
function siteSign(ctx: CanvasRenderingContext2D, foot: Tile, label: SiteLabel, lift: number) {
  const { post, w, h } = SITE;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 3, foot.y - post, 6, post);
  const top = foot.y - post - h - lift;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - w / 2 - 3, top - 3, w + 6, h + 6);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(foot.x - w / 2, top, w, h);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(foot.x - w / 2, top + h - 5, w, 5);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText(`@${label.login}`, foot.x, top + 12, w - 10);
  ctx.font = canvasFont('small');
  ctx.fillText(label.stage, foot.x, top + 29, w - 10);
  ctx.textBaseline = 'alphabetic';
  return top;
}
