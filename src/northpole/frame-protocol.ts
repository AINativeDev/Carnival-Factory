/**
 * The messages between the map and a square's sandboxed frame, and the checks
 * the map runs on everything a frame sends. A frame runs code the map doesn't
 * trust, so nothing it sends is used before these checks pass.
 */

import {
  isAttractionId,
  isBoothOwner,
  MAX_PRESSES,
  STALL_SHAPES,
  TOWER_LETTERS,
  type SquarePointer,
  type StallStyle,
  type ThemeColor,
} from './square';
import { theme } from './theme';

/** A booth, one of the North Pole's attractions, or one of a level's own squares. */
export type SquareKind = 'booth' | 'attraction' | 'level';

/** The map asks the frame to draw one frame. */
export interface DrawRequest {
  type: 'draw';
  size: number;
  time: number;
  /** Where the pointer is over the square, if it is. */
  pointer?: SquarePointer;
}

/** What a frame may send back, once checked. */
export type FrameMessage =
  | { type: 'ready'; name: string; description: string; stall?: StallStyle }
  | { type: 'frame'; bitmap: ImageBitmap; drawMs: number }
  | { type: 'error'; message: string };

/** The largest square a frame draws, in pixels a side. */
export const MAX_SIZE = 2048;
export const MAX_NAME = 60;
export const MAX_DESCRIPTION = 200;

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/**
 * Checks a message from a frame. Anything that isn't one of the expected
 * shapes, or a bitmap that isn't the size the map asked for, gives undefined
 * and is ignored. `isBitmap` is passed in so this runs in tests without a DOM.
 */
export function readFrameMessage(
  data: unknown,
  expectedSize: number | undefined,
  isBitmap: (value: unknown) => value is ImageBitmap,
): FrameMessage | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const message = data as Record<string, unknown>;
  switch (message.type) {
    case 'ready': {
      const name = text(message.name, MAX_NAME);
      if (!name) return undefined;
      const description = text(message.description, MAX_DESCRIPTION);
      const stall = readStall(message.stall);
      return stall
        ? { type: 'ready', name, description, stall }
        : { type: 'ready', name, description };
    }
    case 'frame': {
      const { bitmap, drawMs } = message;
      if (!isBitmap(bitmap)) return undefined;
      if (bitmap.width !== expectedSize || bitmap.height !== expectedSize) return undefined;
      const ms = typeof drawMs === 'number' && Number.isFinite(drawMs) ? Math.max(0, drawMs) : 0;
      return { type: 'frame', bitmap, drawMs: ms };
    }
    case 'error':
      return { type: 'error', message: text(message.message, 200) };
    default:
      return undefined;
  }
}

const isThemeColor = (value: unknown): value is ThemeColor =>
  typeof value === 'string' && Object.hasOwn(theme.colors, value);

/**
 * Checks a square's stall option: a `shape` from `STALL_SHAPES`, a `roof`
 * that names a `theme` colour, a `trim` that is missing or names one too, and
 * a `tower` that is missing or one to six capitals. Anything else gives
 * undefined, and the map draws the usual stall. Only those fields are kept.
 */
export function readStall(value: unknown): StallStyle | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { shape, roof, trim, tower } = value as Record<string, unknown>;
  if (typeof shape !== 'string' || !(STALL_SHAPES as readonly string[]).includes(shape)) {
    return undefined;
  }
  if (!isThemeColor(roof)) return undefined;
  if (trim !== undefined && !isThemeColor(trim)) return undefined;
  if (tower !== undefined && (typeof tower !== 'string' || !TOWER_LETTERS.test(tower)))
    return undefined;
  return {
    shape: shape as StallStyle['shape'],
    roof,
    ...(trim === undefined ? {} : { trim }),
    ...(tower === undefined ? {} : { tower }),
  };
}

const within = (value: unknown, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

/**
 * Checks a pointer for a square `size` across: `x` and `y` finite and within
 * `0..size`, `down` a boolean, and `presses` a whole number from 0 to
 * `MAX_PRESSES`. Anything else gives undefined. Only those four fields are
 * kept, so nothing else the message carried reaches the square.
 */
export function readPointer(value: unknown, size: number): SquarePointer | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { x, y, down, presses } = value as Record<string, unknown>;
  if (!within(x, size) || !within(y, size) || typeof down !== 'boolean') return undefined;
  if (!within(presses, MAX_PRESSES) || !Number.isInteger(presses)) return undefined;
  return { x, y, down, presses };
}

/**
 * Checks a draw request inside the frame: a whole size in range, and a finite
 * time. A pointer that doesn't pass `readPointer` is dropped, and the request
 * draws as if the pointer were elsewhere.
 */
export function readDrawRequest(data: unknown): DrawRequest | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const { type, size, time, pointer } = data as Record<string, unknown>;
  if (type !== 'draw') return undefined;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1 || size > MAX_SIZE) {
    return undefined;
  }
  if (typeof time !== 'number' || !Number.isFinite(time)) return undefined;
  const checked = readPointer(pointer, size);
  return checked ? { type, size, time, pointer: checked } : { type, size, time };
}

/**
 * Which square a frame runs, from its address: `square.html#booth/<login>`,
 * `square.html#attraction/<id>`, or `square.html#level/<login>/<id>` for one of
 * a level's own squares, each id checked by its own kind's rules.
 */
export function readFrameAddress(
  hash: string,
): { kind: SquareKind; id: string; level?: string } | undefined {
  const square = hash.match(/^#level\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
  if (square) {
    const [, level, id] = square;
    return isBoothOwner(level) && isAttractionId(id) ? { kind: 'level', id, level } : undefined;
  }
  const match = hash.match(/^#(booth|attraction)\/([a-z0-9-]+)$/);
  if (!match) return undefined;
  const [, kind, id] = match;
  const valid = kind === 'booth' ? isBoothOwner(id) : isAttractionId(id);
  return valid ? { kind: kind as SquareKind, id } : undefined;
}
