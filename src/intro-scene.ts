/**
 * The intro's three little dioramas (docs/specs/intro.md): an elf writing a
 * booth request, the factory's workshop humming, and a stall popping up on an
 * empty spot. Drawn in the diorama style (docs/style.md), from `time` in
 * seconds alone, so a still frame at `STILL` is the whole story with reduced
 * motion.
 */
import { box, glow, iso, pine, scene, shadow } from './northpole/diorama';
import { theme } from './northpole/theme';

const { colors } = theme;

/** Each beat's line under its scene. The copy is plain on purpose: no hype, no emoji. */
export const INTRO_BEATS = [
  { title: 'Write an issue.', line: 'Describe the booth you want in a GitHub issue.' },
  {
    title: 'The factory builds it.',
    line: "A software factory builds it, tests it and checks it's safe.",
  },
  {
    title: 'It lands on the map.',
    line: "Minutes later, it's on the map for everyone to visit.",
  },
];

/** The moment each scene is drawn at with reduced motion: the letter written, the stall standing. */
export const STILL = 3;

/** How long the stall's beat takes before it starts again: an empty spot, the pop, then the stall. */
const STALL_CYCLE = 4;

/** Draws one beat's scene, `size` pixels square, at `time` seconds. */
export function drawBeat(ctx: CanvasRenderingContext2D, beat: number, size: number, time: number) {
  const paint = [elfWithLetter, workshop, stallPops].at(beat);
  if (paint) scene(ctx, size, time, paint);
}

/** An elf in a pointed hat, standing on (x, y), its feet tapping with `time`. */
function elf(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  shadow(ctx, x, y, 12);
  const tap = Math.max(0, Math.sin(time * 6)) * 0.8;
  ctx.fillStyle = colors.pineDark;
  ctx.fillRect(x - 3, y - 5 - tap, 2.4, 5);
  ctx.fillRect(x + 0.6, y - 5, 2.4, 5);
  ctx.fillStyle = colors.pine;
  ctx.fillRect(x - 4, y - 14, 8, 10);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 4, y - 9, 8, 1.5);
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(x, y - 17, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 19);
  ctx.lineTo(x + 4, y - 19);
  ctx.lineTo(x + 6, y - 27);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(x + 6, y - 27, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

/** Beat one: an elf by a pine holds up a letter, and its lines write themselves. */
function elfWithLetter(ctx: CanvasRenderingContext2D, time: number) {
  pine(ctx, 30, 62, 24);
  elf(ctx, 46, 72, time);
  const bob = Math.sin(time * 2) * 1.2;
  const top = 46 + bob;
  glow(ctx, 60, top + 7, 12, 0.7);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(52, top, 16, 13);
  ctx.strokeStyle = colors.slabShade;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(52, top);
  ctx.lineTo(60, top + 5);
  ctx.lineTo(68, top);
  ctx.stroke();
  // The request's lines, one by one, then all of them for a moment.
  const written = Math.min(3, Math.floor(time * 1.5) % 5);
  ctx.fillStyle = colors.ink;
  for (let line = 0; line < written; line++) ctx.fillRect(54, top + 7 + line * 2, 12 - line * 3, 1);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(49, 57 + bob / 2, 4, 2.4);
}

/** Beat two: a workshop with a lit window, a turning gear and smoke from its chimney. */
function workshop(ctx: CanvasRenderingContext2D, time: number) {
  pine(ctx, 22, 66, 18);
  const ground = iso(0, 0);
  shadow(ctx, ground.x, ground.y + 6, 34);
  box(ctx, -10, -8, 20, 16, 16, colors.wood, colors.gingerbread, colors.cocoa);
  box(ctx, -12, -10, 24, 20, 3, colors.snow, colors.berry, colors.shadow, 16);
  const chimney = iso(6, -6, 19);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(chimney.x - 2, chimney.y - 6, 4, 6);
  for (let puff = 0; puff < 3; puff++) {
    const rise = (time * 0.5 + puff / 3) % 1;
    ctx.globalAlpha = 0.7 * (1 - rise);
    ctx.fillStyle = colors.cloud;
    ctx.beginPath();
    ctx.arc(chimney.x + rise * 6, chimney.y - 8 - rise * 18, 2 + rise * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const pane = iso(-4, 8, 9);
  glow(ctx, pane.x, pane.y, 10, 0.7 + 0.3 * Math.sin(time * 3));
  ctx.fillStyle = colors.lantern;
  ctx.fillRect(pane.x - 3, pane.y - 3, 6, 5);
  gear(ctx, 72, 52, time);
}

/** A gold gear the size of a coin, turning with `time`. */
function gear(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 1.5);
  ctx.fillStyle = colors.gold;
  for (let tooth = 0; tooth < 8; tooth++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-1.2, -6.5, 2.4, 3);
  }
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Where the stall's sparkles fly from, round its middle. */
const SPARKLES = [
  { dx: -16, dy: -30 },
  { dx: 14, dy: -34 },
  { dx: 20, dy: -18 },
  { dx: -20, dy: -14 },
];

/** How far up the stall has popped, from 0 to a little over 1 and back to 1, a second into its cycle. */
function popped(time: number) {
  const t = Math.min(1, Math.max(0, ((time % STALL_CYCLE) - 1) / 0.6));
  return 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
}

/** Beat three: an empty spot, then a stall with a striped awning pops up on it, and sparkles. */
function stallPops(ctx: CanvasRenderingContext2D, time: number) {
  pine(ctx, 76, 62, 20);
  const corners = [iso(-10, -10), iso(10, -10), iso(10, 10), iso(-10, 10)];
  ctx.strokeStyle = colors.slabShade;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  corners.forEach((corner, n) => {
    if (n) ctx.lineTo(corner.x, corner.y);
    else ctx.moveTo(corner.x, corner.y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  const rise = popped(time);
  if (rise <= 0.01) return;
  box(ctx, -7, -6, 14, 12, 12 * rise, colors.cream, colors.pine, colors.pineDark);
  if (rise < 0.8) return;
  for (let stripe = 0; stripe < 4; stripe++) {
    const from = -9 + stripe * 4.5;
    const color = stripe % 2 ? colors.snow : colors.berry;
    box(ctx, from, -8, 4.5, 16, 2, color, color, colors.shadow, 12 * rise);
  }
  const since = (time % STALL_CYCLE) - 1.6;
  if (since < 0 || since > 0.8) return;
  ctx.fillStyle = colors.gold;
  ctx.globalAlpha = 1 - since / 0.8;
  const at = iso(0, 0);
  for (const { dx, dy } of SPARKLES) {
    ctx.fillRect(at.x + dx * (1 + since), at.y + dy * (1 + since / 2), 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
}
