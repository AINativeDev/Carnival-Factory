/**
 * The four stations of the build loop: an arch over the belt at request,
 * build, review and merge, each with its name on a sign that lights up as the
 * parcel passes under it, and over the station ahead a bubble asking for the
 * skill it needs, with a bar that runs down as the parcel nears it.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { type Game, progressOf } from './game';
import { SKILLS, STATION_NAMES, STATIONS } from './rules';
import { words } from './text';
import { LOOP, LOOP_MIDDLE, onLoop } from './track';

const { colors } = theme;

/** Each station's arch colour, in loop order. */
const ARCH_COLORS = [colors.ice, colors.gingerbread, colors.violet, colors.gold];

/** How high an arch stands over the belt. */
const HIGH = 9;

/**
 * How lit station `n` is with the parcel `progress` into the leg for station
 * `leg`: fully as it reaches the station, fading as it rides away.
 */
export function stationLight(n: number, leg: number, progress: number): number {
  if (n === leg) return Math.max(0, (progress - 0.85) / 0.15);
  if (n === (leg + 3) % 4) return Math.max(0, 1 - progress / 0.2);
  return 0;
}

/** Station `n`'s arch over the belt, its sign lit by `light` from 0 to 1. */
function arch(ctx: CanvasRenderingContext2D, n: number, light: number) {
  const along = STATIONS.at(n) ?? 0;
  const color = ARCH_COLORS.at(n) ?? colors.ice;
  const posts = [onLoop(along, -LOOP.width - 0.8), onLoop(along, LOOP.width + 0.8)];
  ctx.fillStyle = color;
  for (const foot of posts) ctx.fillRect(foot.x - 0.6, foot.y - HIGH, 1.2, HIGH);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  posts.forEach((foot, k) => {
    if (k) ctx.lineTo(foot.x, foot.y - HIGH);
    else ctx.moveTo(foot.x, foot.y - HIGH);
  });
  ctx.stroke();
  const sign = onLoop(along, 0, HIGH + 2.6);
  glow(ctx, sign.x, sign.y, 6 + light * 5, 0.3 + light * 0.7);
  const label = STATION_NAMES.at(n) ?? '';
  const width = label.length * 1.75 + 2.6;
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.roundRect(sign.x - width / 2, sign.y - 2.1, width, 4.2, 1);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.4;
  ctx.stroke();
  words(ctx, label, sign.x, sign.y + 0.1, 2.6, light > 0.5 ? colors.glow : colors.snow);
}

/** The arches on the back half of the loop (`back`) or the front half. */
export function arches(ctx: CanvasRenderingContext2D, game: Game, back: boolean) {
  const progress = progressOf(game);
  STATIONS.forEach((along, n) => {
    if (onLoop(along).y < LOOP_MIDDLE !== back) return;
    arch(ctx, n, stationLight(n, game.leg, progress));
  });
}

/**
 * The bubble over the station ahead: the skill it asks for in that skill's
 * colour, and a bar of the time left; a tick once it has it.
 */
export function needBubble(ctx: CanvasRenderingContext2D, game: Game) {
  const tail = onLoop(STATIONS.at(game.leg) ?? 0, 0, HIGH + 9.5);
  // Kept clear of the skill cards on the left; its tail still points at the station.
  const sign = { x: Math.max(tail.x, 36), y: tail.y };
  const skill = SKILLS.at(game.need) ?? SKILLS[0];
  const color = skill.color;
  const w = 17;
  const h = 7;
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.roundRect(sign.x - w / 2, sign.y - h / 2, w, h, 1.6);
  ctx.moveTo(tail.x - 1.4, sign.y + h / 2);
  ctx.lineTo(tail.x, sign.y + h / 2 + 2);
  ctx.lineTo(tail.x + 1.4, sign.y + h / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.roundRect(sign.x - w / 2, sign.y - h / 2, w, h, 1.6);
  ctx.stroke();
  if (game.answer === 'right') {
    words(ctx, '✓ ' + skill.name, sign.x, sign.y - 0.2, 2.8, colors.mint, 'center', w - 2);
    return;
  }
  words(ctx, 'NEEDS', sign.x, sign.y - 1.8, 1.6, colors.muted);
  words(ctx, skill.name, sign.x, sign.y + 0.7, 3, color, 'center', w - 2);
  // The time left, running down as the parcel nears the station.
  const left = 1 - progressOf(game);
  ctx.fillStyle = left < 0.3 ? colors.berry : color;
  ctx.fillRect(sign.x - w / 2 + 1.5, sign.y + h / 2 - 1.3, (w - 3) * left, 0.6);
}
