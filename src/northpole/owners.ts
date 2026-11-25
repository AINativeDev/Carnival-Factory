/**
 * Who owns what on the map, at a glance: each owner's colour, their avatar's
 * address, a name shortened to fit a sign, and how strongly a picked square is
 * highlighted as time passes. Plain functions, so the map, the page and the
 * tests use them the same way.
 */
import { theme } from './theme';

const { colors } = theme;

/**
 * The colours an owner's pennant and sign trim come from: theme colours that
 * stay readable against the cream sign and the snow, and differ from each
 * other. The North Pole's own red and white are left for the attractions.
 */
export const OWNER_COLORS: readonly string[] = [
  colors.pine,
  colors.violet,
  colors.gold,
  colors.gingerbread,
  colors.ice,
  colors.mint,
  colors.lantern,
  colors.duskLow,
];

/** A small, steady hash of a login (FNV-1a), the same in every browser and in Node. */
function loginHash(login: string): number {
  let hash = 0x811c9dc5;
  for (const char of login.toLowerCase()) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** The colour an owner's booth flies, picked from their login alone, ignoring case. */
export function ownerColor(login: string, palette: readonly string[] = OWNER_COLORS): string {
  return palette[loginHash(login) % palette.length];
}

/** Where the build keeps an owner's avatar, from the site's root (scripts/download-avatars.ts). */
export const avatarPath = (login: string) =>
  `avatars/${encodeURIComponent(login.toLowerCase())}.png`;

/** A name cut to at most `max` characters, ending in an ellipsis when it was longer. */
export function shorten(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return `${chars
    .slice(0, Math.max(1, max - 1))
    .join('')
    .trimEnd()}…`;
}

/** How long a picked square stays highlighted, and how long its highlight takes to fade, in milliseconds. */
const SELECT_TIME = 6000;
const SELECT_FADE = 1500;

/**
 * How strongly a picked square is highlighted, from 1 down to 0, `elapsed`
 * milliseconds after it was picked: full for a while, then fading out. With
 * reduced motion it fades the same, so it never flashes.
 */
export function highlightAt(elapsed: number, time = SELECT_TIME, fade = SELECT_FADE): number {
  if (elapsed < 0) return 0;
  return Math.max(0, Math.min(1, (time - elapsed) / fade));
}

/** How high the arrow over a picked square's sign bounces, in world pixels: still with reduced motion. */
export function arrowBounce(time: number, still: boolean): number {
  return still ? 0 : Math.abs(Math.sin(time / 320)) * 10;
}

/** How long the call to action waits before it fades in, and how long the fade takes, in milliseconds. */
const INVITE_DELAY = 400;
const INVITE_FADE = 300;

/**
 * How visible the call to action over a door is, `elapsed` milliseconds after
 * its square became the one to invite into: nothing for a moment, so walking
 * past doesn't flicker it, then fading in.
 */
export function inviteOpacity(elapsed: number, delay = INVITE_DELAY, fade = INVITE_FADE): number {
  return Math.max(0, Math.min(1, (elapsed - delay) / fade));
}

/** The square to invite the player into: the picked one if there is one, otherwise the one they stand at. */
export function inviteFor<T>(selected: T | undefined, near: T | undefined): T | undefined {
  return selected ?? near;
}
