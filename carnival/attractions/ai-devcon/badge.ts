/**
 * The badge moment: when a visitor starts playing, a conference badge drops
 * in on its lanyard from the top left, swings, settles and is put away; win
 * the keynote and a gold SUPERFAN badge drops in its place.
 */
import { theme } from '../../../src/northpole/theme';
import { EVENT } from './program';
import { BADGE_FOR, type BadgeKind } from './state';
import { words } from './words';

const { colors } = theme;

/** Where the lanyard hangs from. */
const PIVOT = { x: 14, y: -2 };
/** How long the badge takes to drop in, and to go back up. */
export const DROP = 600;

/** How far down the lanyard the badge hangs and how far it swings, `elapsed` ms after it was handed out; undefined once it's away. */
export function badgeSwing(elapsed: number): { reach: number; angle: number } | undefined {
  if (elapsed < 0 || elapsed >= BADGE_FOR) return undefined;
  const down = Math.min(1, elapsed / DROP, (BADGE_FOR - elapsed) / DROP);
  const ease = 1 - (1 - down) * (1 - down);
  const angle = 0.35 * Math.exp(-elapsed / 900) * Math.sin(elapsed / 170);
  return { reach: -40 + ease * 54, angle };
}

/** The badge `kind`, handed out at `at`, as it hangs at `time`. */
export function badge(ctx: CanvasRenderingContext2D, kind: BadgeKind, at: number, time: number) {
  const swing = badgeSwing(time - at);
  if (!swing) return;
  const gold = kind === 'superfan';
  ctx.save();
  ctx.translate(PIVOT.x, PIVOT.y);
  ctx.rotate(swing.angle);
  const top = swing.reach;
  ctx.strokeStyle = colors.violet;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.lineTo(-1, top);
  ctx.moveTo(3, 0);
  ctx.lineTo(1, top);
  ctx.stroke();
  ctx.fillStyle = colors.muted;
  ctx.fillRect(-1.6, top - 0.6, 3.2, 1.8);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(-9.4, top + 1.6, 20, 26);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.roundRect(-10, top + 1, 20, 26, 1.5);
  ctx.fill();
  ctx.fillStyle = gold ? colors.gold : colors.violet;
  ctx.fillRect(-10, top + 3, 20, 6);
  words(ctx, EVENT.title, 0, top + 6, { size: 3, color: gold ? colors.ink : colors.snowLit });
  words(ctx, gold ? 'SUPERFAN' : 'ATTENDEE', 0, top + 13, {
    size: 3.4,
    color: colors.ink,
    max: 17,
  });
  words(ctx, 'You', 0, top + 17.5, { size: 2.6, color: colors.cocoa });
  ctx.fillStyle = colors.mint;
  ctx.fillRect(-7, top + 20, 14, 0.5);
  words(ctx, EVENT.next, 0, top + 22.4, { size: 2, color: colors.ink, max: 17 });
  words(ctx, EVENT.date, 0, top + 25, { size: 2, color: colors.ink, max: 17 });
  ctx.restore();
}
