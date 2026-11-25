/**
 * How each kind of square letters its name board, so the midway doesn't read as
 * one typeface on one cream board: a market stall's painted cream board, a
 * shed's dark board with condensed capitals, a tent's berry banner in gold
 * italics, a cabin's carved plank, a kiosk's gold plaque, and the North Pole's
 * own pavilions and towers in gold serif capitals. And how a long name stays
 * readable: it wraps onto two lines before it shrinks, and only a name too long
 * even then is shortened (its hover tag shows it whole). Plain data and
 * functions; name-board.ts draws them.
 */
import type { StallShape } from './square';
import { type SignFamily, theme } from './theme';

const { colors } = theme;

/** A name board's look: its board, its edge, its letters and the line under the name. */
export interface SignStyle {
  board: string;
  edge: string;
  ink: string;
  byInk: string;
  family: SignFamily;
  italic?: boolean;
  caps?: boolean;
}

/** Each kind of square's board. */
export const SIGN_STYLES: Record<StallShape | 'pavilion' | 'tower', SignStyle> = {
  stall: {
    board: colors.cream,
    edge: colors.cocoa,
    ink: colors.ink,
    byInk: colors.berry,
    family: 'sans',
  },
  shed: {
    board: colors.night,
    edge: colors.wood,
    ink: colors.cream,
    byInk: colors.gold,
    family: 'condensed',
    caps: true,
  },
  tent: {
    board: colors.berry,
    edge: colors.gold,
    ink: colors.gold,
    byInk: colors.snow,
    family: 'serif',
    italic: true,
  },
  cabin: {
    board: colors.wood,
    edge: colors.cocoa,
    ink: colors.cream,
    byInk: colors.snowLit,
    family: 'slab',
  },
  kiosk: {
    board: colors.gold,
    edge: colors.cocoa,
    ink: colors.ink,
    byInk: colors.cocoa,
    family: 'rounded',
  },
  pavilion: {
    board: colors.night,
    edge: colors.gold,
    ink: colors.gold,
    byInk: colors.cream,
    family: 'serif',
    caps: true,
  },
  tower: {
    board: colors.night,
    edge: colors.gold,
    ink: colors.gold,
    byInk: colors.cream,
    family: 'serif',
    caps: true,
  },
};

/** How much wider than the board one line may be before the name wraps instead: a little shrinking reads fine. */
export const SHRINK = 1.15;

/**
 * The name as it goes on a board `width` wide, measured by `measure`: one line
 * when it fits (after a little shrinking), otherwise two, broken at the space
 * nearest its middle. A name with no space stays on one line.
 */
export function nameLines(
  name: string,
  width: number,
  measure: (text: string) => number,
): string[] {
  if (measure(name) <= width * SHRINK) return [name];
  const spaces = [...name.matchAll(/ /g)].map((match) => match.index);
  if (spaces.length === 0) return [name];
  const middle = name.length / 2;
  const at = spaces.reduce((best, index) =>
    Math.abs(index - middle) < Math.abs(best - middle) ? index : best,
  );
  return [name.slice(0, at), name.slice(at + 1)];
}
