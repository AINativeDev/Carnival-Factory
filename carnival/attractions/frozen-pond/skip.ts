/**
 * The skip, the elf who plays Frozen Pond's curling while nobody else does:
 * it pulls each stone back as a visitor would, aiming into the wind for the
 * button with a little wobble of its own, and sweeps a stone that would stop
 * short. So the demo plays by the same rules, and never looks broken.
 */
import type { Curling } from './game';
import { HACK, HOUSE, hash, onScreen } from './sheet';
import { FRICTION, PULL, REACH, STEER, throwFrom, type Throw } from './stones';

/** When the skip starts pulling back after the stones stop, lets go, and how long between sweeps. */
const SETTLE = 900;
const LET_GO = 2_100;
const STROKE = 170;

/** Eases from 0 to 1 and comes to rest. */
function ease(p: number): number {
  return (1 - Math.cos(Math.min(1, Math.max(0, p)) * Math.PI)) / 2;
}

/**
 * The skip's drag for the stone about to be thrown, `pulled` of the way back:
 * aimed to finish near the button, leaning into the wind by about as much as it
 * will push the stone across on the way.
 */
function skipDrag(game: Curling, pulled: number) {
  const n = game.seed + game.end * 13 + game.thrown * 5;
  const length = HOUSE.s - HACK + (hash(n) - 0.5) * 7;
  const across = (hash(n + 1) - 0.5) * 5 - (game.wind * length) / (2 * FRICTION);
  const angle = Math.atan2(across, length);
  const back = (length / REACH) * PULL * ease(pulled);
  const from = onScreen(HACK, 0);
  return { from, to: { x: from.x - back, y: from.y - (back * Math.tan(angle)) / STEER } };
}

/** The skip's turn to aim at `time`: it waits, pulls back slowly, and lets go, giving its throw. */
export function skipAims(game: Curling, time: number): Throw | undefined {
  const since = time - game.restAt;
  if (since < SETTLE) return;
  game.drag = skipDrag(game, (since - SETTLE) / (LET_GO - SETTLE - 300));
  if (since < LET_GO) return;
  const thrown = throwFrom(game.drag.from, game.drag.to);
  game.drag = null;
  game.restAt = time;
  return thrown;
}

/** Whether the skip sweeps at `time`: in steady strokes, while the stone it threw would stop short. */
export function skipSweeps(game: Curling, time: number): boolean {
  const stone = game.stones.at(game.current);
  if (!stone || time - (game.sweeps.at(-1) ?? -Infinity) < STROKE) return false;
  const speed = Math.hypot(stone.vs, stone.vw);
  return speed > 0 && stone.s + (stone.vs * speed) / (2 * FRICTION) < HOUSE.s - 1.5;
}
