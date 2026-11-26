/**
 * The studio's cues: how its lights, the headphones and the cards fade in and
 * out, and how the bubbles pop and the crowd hops. Every change takes a few
 * hundred milliseconds, so nothing in the studio flashes (docs/style.md).
 */
import { LISTEN, type Game } from './game';

/** How long a cue takes to fade in or out, in ms. */
export const FADE = 450;
/** How long the crowd's cheer lasts after a tap while they listen. */
export const CHEER = 700;

/** Smooth from 0 to 1 as `t` goes from 0 to 1, flat outside. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** How far into the playback and the wrap-up `time` is: each from 0 to 1, faded in. */
export function afterglow(game: Game, time: number): { listen: number; wrap: number } {
  if (game.ended === null) return { listen: 0, wrap: 0 };
  const since = time - game.ended;
  const wrap = ease((since - LISTEN) / FADE);
  return { listen: Math.min(ease(since / FADE), 1 - wrap), wrap };
}

/** How high an elf in the crowd hops at `time` after a cheer at `cheer`, from 0 to 1. */
export function hop(cheer: number, time: number): number {
  const t = (time - cheer) / CHEER;
  return t < 0 || t > 1 ? 0 : Math.sin(t * Math.PI);
}

/** A bubble's size as it pops out: a little past full, then settling, from `age` 0 to 1. */
export function pop(age: number): number {
  const t = Math.min(1, age * 6);
  return t < 1 ? t * 1.15 : 1.15 - Math.min(0.15, (age - 1 / 6) * 1.2);
}
