/**
 * The keys a square may hear while someone is inside it: the arrows, Enter and
 * Space, by plain names, never the page's own events (ADR 0064). The map
 * collects them, the sandbox carries them with the next draw request, and the
 * frame and the worker each keep only these names, at most `MAX_KEYS` a frame.
 */

/** A key a square may hear, by its plain name. */
export type SquareKey = 'left' | 'right' | 'up' | 'down' | 'enter' | 'space';

/** The most keys one frame carries. Any more wait for the next frame. */
export const MAX_KEYS = 8;

/** The name a square hears `eventKey` (a `KeyboardEvent.key`) by, or undefined for a key it never hears. */
export function squareKey(eventKey: string): SquareKey | undefined {
  switch (eventKey) {
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'Enter':
      return 'enter';
    case ' ':
      return 'space';
    default:
      return undefined;
  }
}

/** Whether `value` is one of the names a square hears. */
const isSquareKey = (value: unknown): value is SquareKey =>
  ['left', 'right', 'up', 'down', 'enter', 'space'].some((name) => name === value);

/** The keys in a message, kept only when it's a list of known names, at most `MAX_KEYS` of them. */
export function readKeys(value: unknown): SquareKey[] | undefined {
  if (!Array.isArray(value) || !value.length || value.length > MAX_KEYS) return undefined;
  return value.every(isSquareKey) ? value : undefined;
}
