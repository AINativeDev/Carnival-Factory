/**
 * The studio's cues: how its lights, the headphones and the cards fade in and
 * out, how new text eases in, how things pop and how the crowd hops. Every
 * change takes a few hundred milliseconds, so nothing in the studio flashes
 * (docs/style.md).
 */
import { LISTEN, type Game } from './game';

/** How long a cue takes to fade in or out, in ms. */
export const FADE = 450;
/** How long the crowd's cheer lasts after a tap while they listen. */
export const CHEER = 700;
/** How long new text takes to ease in, in ms. */
export const APPEAR = 300;
/** How long a pop takes to settle, in ms. */
const POP = 280;

/** Smooth from 0 to 1 as `t` goes from 0 to 1, flat outside. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** How far new text has eased in, `ms` after it appeared: its alpha, from 0 to 1. */
export const appear = (ms: number) => ease(ms / APPEAR);

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

/**
 * A thing's size as it pops in, `ms` after it appeared: from 0.7, a little
 * past full, then settled at 1. It never starts from nothing, so text in it
 * is never too small to read, and its alpha eases in with it.
 */
export function pop(ms: number): number {
  const t = Math.min(1, Math.max(0, ms / POP)) - 1;
  const back = 2.2;
  return 0.7 + 0.3 * (1 + (back + 1) * t ** 3 + back * t ** 2);
}

/** A gentle breath for the primary button's glow, from 0 to 1 and back every 2 s. */
export const breath = (time: number) => 0.5 + 0.5 * Math.sin((time / 2_000) * Math.PI * 2);
