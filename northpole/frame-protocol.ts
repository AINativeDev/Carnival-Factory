/**
 * The messages between the map and a square's sandboxed frame, and the checks
 * the map runs on everything a frame sends. A frame runs code the map doesn't
 * trust, so nothing it sends is used before these checks pass.
 */

import { isAttractionId, isBoothOwner } from './square';

export type SquareKind = 'booth' | 'attraction';

/** The map asks the frame to draw one frame. */
export interface DrawRequest {
  type: 'draw';
  size: number;
  time: number;
}

/** What a frame may send back, once checked. */
export type FrameMessage =
  | { type: 'ready'; name: string; description: string }
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
      return name
        ? { type: 'ready', name, description: text(message.description, MAX_DESCRIPTION) }
        : undefined;
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

/** Checks a draw request inside the frame: a whole size in range, and a finite time. */
export function readDrawRequest(data: unknown): DrawRequest | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const { type, size, time } = data as Record<string, unknown>;
  if (type !== 'draw') return undefined;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1 || size > MAX_SIZE) {
    return undefined;
  }
  if (typeof time !== 'number' || !Number.isFinite(time)) return undefined;
  return { type, size, time };
}

/**
 * Which square a frame runs, from its address: `square.html#booth/<login>` or
 * `square.html#attraction/<id>`, each id checked by its own kind's rules.
 */
export function readFrameAddress(hash: string): { kind: SquareKind; id: string } | undefined {
  const match = hash.match(/^#(booth|attraction)\/([a-z0-9-]+)$/);
  if (!match) return undefined;
  const [, kind, id] = match;
  const valid = kind === 'booth' ? isBoothOwner(id) : isAttractionId(id);
  return valid ? { kind: kind as SquareKind, id } : undefined;
}
