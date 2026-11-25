/**
 * The rest of a level's performers: the acrobats, the band and the
 * strongman. Like the others in `performers.ts`, each moves only from `time`
 * and its variant, in calm loops a few seconds long.
 */
import { shadow } from './brushes';
import { elf, outfit, phase, swing } from './elf';
import { theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** How long the acrobat on top takes to sway from one side and back. */
const SWAY = 3200;

/** Two elves, one standing on the other's shoulders, the top one wobbling with its arms out. */
export function drawAcrobats(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 14);
  const lean = (swing(time, SWAY, thing.seed) - 0.5) * 0.24;
  const below = outfit(thing.seed);
  const above = outfit((thing.seed + 0.5) % 1);
  elf(ctx, x, y, { ...below, left: { x: -3, y: -10 }, right: { x: 3, y: -10 }, stride: 0.6 });
  ctx.save();
  ctx.translate(x, y - 26);
  ctx.rotate(lean);
  elf(ctx, 0, 0, {
    ...above,
    left: { x: -12, y: -8 + lean * 20 },
    right: { x: 12, y: -8 - lean * 20 },
  });
  ctx.restore();
}

/** How long a note takes to drift up from the band and fade away. */
const NOTE = 3600;
const NOTES = 3;

/** Where note `n` is above the band, and how clear, `seed` its variant. */
export function noteAt(time: number, seed: number, n: number) {
  const rise = phase(time, NOTE, seed + n / NOTES);
  return {
    x: Math.sin(rise * Math.PI * 2 + n) * 8 + (n - 1) * 10,
    y: -54 - rise * 36,
    alpha: 1 - rise,
  };
}

/** A drummer and a horn player, with notes drifting up from them. */
export function drawBand(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 22);
  const beat = swing(time, 900, thing.seed);
  const drummer = { x: x - 11, y: y - 3 };
  const hands = elf(ctx, drummer.x, drummer.y, {
    ...outfit(thing.seed),
    left: { x: 0, y: 6 - 6 * beat },
    right: { x: 4, y: 2 + 6 * beat },
  });
  // The drum, in front of the drummer, hung at its waist.
  ctx.fillStyle = colors.berry;
  ctx.fillRect(drummer.x - 7, drummer.y - 18, 14, 10);
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(drummer.x, drummer.y - 18, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(drummer.x - 7, drummer.y - 10, 14, 2);
  ctx.strokeStyle = colors.cocoa;
  ctx.beginPath();
  ctx.moveTo(hands.right.x, hands.right.y);
  ctx.lineTo(hands.right.x - 5, hands.right.y + 4);
  ctx.stroke();
  const horn = { x: x + 11, y: y + 3 };
  const sway = (beat - 0.5) * 2;
  const player = elf(ctx, horn.x, horn.y, {
    ...outfit((thing.seed + 0.3) % 1),
    left: { x: 6, y: -6 },
    right: { x: 8, y: -4 },
  });
  // The horn, from the player's mouth out to a gold bell.
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(horn.x + 4, horn.y - 30);
  ctx.lineTo(player.right.x + 4, player.right.y - 2 + sway);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(player.right.x + 3, player.right.y - 2 + sway);
  ctx.lineTo(player.right.x + 10, player.right.y - 7 + sway);
  ctx.lineTo(player.right.x + 10, player.right.y + 3 + sway);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.strokeStyle = colors.snow;
  for (let n = 0; n < NOTES; n++) {
    const note = noteAt(time, thing.seed, n);
    ctx.globalAlpha = note.alpha;
    ctx.beginPath();
    ctx.ellipse(x + note.x, y + note.y, 2.5, 2, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + note.x + 2, y + note.y);
    ctx.lineTo(x + note.x + 2, y + note.y - 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** How long a strongman takes to lift the barbell overhead and lower it again. */
const LIFT = 3800;

/** An elf lifting a candy-cane barbell over its head, and slowly lowering it. */
export function drawStrongman(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  const up = swing(time, LIFT, thing.seed);
  const hands = elf(ctx, x, y, {
    ...outfit(thing.seed),
    left: { x: -8, y: 6 - 30 * up },
    right: { x: 8, y: 6 - 30 * up },
    stride: 0.8,
  });
  const bar = { y: hands.left.y, from: hands.left.x - 9, to: hands.right.x + 9 };
  const stripes = 6;
  const step = (bar.to - bar.from) / stripes;
  for (let n = 0; n < stripes; n++) {
    ctx.fillStyle = n % 2 ? colors.snow : colors.berry;
    ctx.fillRect(bar.from + n * step, bar.y - 1.5, step, 3);
  }
  ctx.fillStyle = colors.night;
  for (const end of [bar.from, bar.to]) {
    ctx.beginPath();
    ctx.ellipse(end, bar.y, 3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
