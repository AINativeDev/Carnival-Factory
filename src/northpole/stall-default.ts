/**
 * The stall a square stands in when it chooses none: a shape and colours
 * picked from its id, the same every time, so a midway of squares that never
 * asked still reads as many different stalls rather than one stall over and
 * over. A square that sets `stall` keeps exactly what it chose.
 */
import { inTurn } from './rounds';
import { STALL_SHAPES, type NorthPoleSquare, type StallStyle, type ThemeColor } from './square';

type ColourPair = readonly [ThemeColor, ThemeColor];

/** The roof and trim pairs a square's id picks from, each a bright accent over a quiet one. */
const COLOURS: readonly [ColourPair, ...ColourPair[]] = [
  ['berry', 'snow'],
  ['pine', 'cream'],
  ['violet', 'cream'],
  ['gingerbread', 'snow'],
  ['gold', 'cocoa'],
  ['mint', 'surface'],
  ['ice', 'night'],
];

/** A whole number from `text`, the same for the same text, spread well over its range (FNV-1a). */
export function idHash(text: string): number {
  let hash = 0x811c9dc5;
  for (let n = 0; n < text.length; n++) hash = Math.imul(hash ^ text.charCodeAt(n), 0x01000193);
  return hash >>> 0;
}

/** The stall picked for a square with id `id` that chose none. */
export function defaultStall(id: string): StallStyle {
  const hash = idHash(id);
  const shape = inTurn(STALL_SHAPES, hash);
  const [roof, trim] = inTurn(COLOURS, Math.floor(hash / STALL_SHAPES.length));
  return { shape, roof, trim };
}

/** The stall a square stands in: the one it chose, or the one its id picks. */
export function chosenStall(square: NorthPoleSquare): StallStyle {
  return square.stall ?? defaultStall(square.id);
}
