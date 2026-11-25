/**
 * The people and reindeer about the island: visitors strolling the lanes,
 * skaters going round the pond, reindeer wandering their paddock, and the
 * player with a marker over their head. Each joins the scene at its depth, so
 * what stands in front of it hides it.
 */
import type { MapRun } from './map-state';
import { drawReindeer } from './people';
import { type Look } from './people';
import { drawPerson } from './people';
import { theme } from './theme';
import { toScreen } from './world';
import { strollAt } from './walking';

const { colors } = theme;

/** How the player looks: bigger than the crowd, in a berry coat. */
export const PLAYER: Look = { coat: colors.berry, hat: colors.pine, scale: 1.25 };
const LOOKS: Look[] = [
  { coat: colors.pine, hat: colors.berry, scale: 0.95 },
  { coat: colors.violet, hat: colors.gold, scale: 1 },
  { coat: colors.gingerbread, hat: colors.pine, scale: 0.9 },
  { coat: colors.surface, hat: colors.berry, scale: 1.05 },
];
/** The look of the crowd's `n`th person, round the looks in turn. */
export const lookOf = (n: number) => LOOKS[n % LOOKS.length] ?? PLAYER;

/** Adds something to the scene, to be drawn at its depth. */
export type AddToScene = (depth: number, draw: () => void) => void;

/** The strollers, the skaters and the reindeer, each at its place this frame. */
export function addCrowd(m: MapRun, add: AddToScene, time: number, motion: number, still: boolean) {
  const { ctx, world } = m;
  world.strolls.forEach((stroll, n) => {
    const at = strollAt(stroll, still ? 0 : time);
    add(at.x + at.y, () => {
      drawPerson(ctx, at, lookOf(n), at.facing, !still, time);
    });
  });
  const { pond, paddock } = world;
  // A level may have no pond, and has no paddock.
  for (let n = 0; n < (pond.w ? 3 : 0); n++) {
    const turn = motion / (2600 + n * 500) + n * 2.1;
    const at = {
      x: pond.x + (pond.w - 1) / 2 + Math.cos(turn) * (pond.w / 2 - 1),
      y: pond.y + (pond.h - 1) / 2 + Math.sin(turn) * (pond.h / 2 - 0.9),
    };
    add(at.x + at.y, () => {
      drawPerson(ctx, at, lookOf(n + 1), Math.sin(turn) < 0 ? 1 : -1, false, 0);
    });
  }
  for (let n = 0; n < (paddock.w ? 3 : 0); n++) {
    const wander = motion / (6000 + n * 1300) + n * 2;
    const at = {
      x: paddock.x + ((paddock.w - 1) * (1 + Math.sin(wander))) / 2,
      y: paddock.y + ((paddock.h - 1) * (1 + Math.sin(wander * 1.7 + n))) / 2,
    };
    add(at.x + at.y, () => {
      drawReindeer(ctx, at, Math.cos(wander) >= 0 ? 1 : -1, n === 0, motion);
    });
  }
}

/** The player, with a marker over their head so they can find themselves, bigger when the camera is far. */
export function addPlayer(m: MapRun, add: AddToScene, time: number, still: boolean) {
  const { ctx, player } = m;
  add(player.x + player.y, () => {
    drawPerson(ctx, player, PLAYER, m.facing, m.moving, time);
    const { x, y } = toScreen(player);
    const bob = still ? 0 : Math.sin(time / 300) * 3;
    const big = Math.max(1, 0.6 / m.zoom);
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(x - 6 * big, y - 72 - 10 * big + bob);
    ctx.lineTo(x + 6 * big, y - 72 - 10 * big + bob);
    ctx.lineTo(x, y - 72 + bob);
    ctx.fill();
  });
}
