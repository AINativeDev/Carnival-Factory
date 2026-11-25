/**
 * A canvas that records instead of drawing, for tests that pin what a drawing
 * does before it is refactored, and prove afterwards that nothing changed.
 * Splitting a large drawing file (docs/adr/0019-small-files.md) starts with a
 * test like `expect(fingerprint(drawingOf(draw))).toBe('…')` written first,
 * which must still pass after the split (docs/adr/0024-test-first.md).
 */
import { createHash } from 'node:crypto';

/** One canvas call or property setting, with its arguments as plain values. */
export type CanvasCall = [name: string, ...args: unknown[]];

/** Numbers to six decimals, so floating-point noise between equal drawings never counts. */
const plain = (value: unknown, names: WeakMap<object, string>): unknown => {
  if (typeof value === 'number') return Math.round(value * 1e6) / 1e6;
  if (value && typeof value === 'object') return names.get(value) ?? value;
  return value;
};

/** Runs `draw` on a recording canvas and gives back every call it made, in order. */
export function drawingOf(draw: (ctx: CanvasRenderingContext2D) => void): CanvasCall[] {
  const calls: CanvasCall[] = [];
  const names = new WeakMap<object, string>();
  const state: Record<string, unknown> = {};
  let made = 0;

  const madeThing = (kind: string) => {
    const name = `${kind}-${String(made++)}`;
    const thing = new Proxy(
      {},
      {
        get:
          (_target, method) =>
          (...args: unknown[]) => {
            calls.push([`${name}.${String(method)}`, ...args.map((arg) => plain(arg, names))]);
          },
      },
    );
    names.set(thing, name);
    return thing;
  };

  const answers: Partial<Record<string, (...args: unknown[]) => unknown>> = {
    measureText: (text) => ({ width: String(text).length * 6 }),
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    isPointInPath: () => false,
    isPointInStroke: () => false,
    createLinearGradient: () => madeThing('gradient'),
    createRadialGradient: () => madeThing('gradient'),
    createConicGradient: () => madeThing('gradient'),
    createPattern: () => madeThing('pattern'),
  };

  const ctx = new Proxy(state, {
    get: (_target, property) => {
      const key = String(property);
      if (key in state) return state[key];
      return (...args: unknown[]) => {
        calls.push([key, ...args.map((arg) => plain(arg, names))]);
        return answers[key]?.(...args);
      };
    },
    set: (_target, property, value: unknown) => {
      state[String(property)] = value;
      calls.push([`=${String(property)}`, plain(value, names)]);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;

  draw(ctx);
  return calls;
}

/** A short, stable name for a drawing, to pin a large one in a test without storing every call. */
export function fingerprint(calls: CanvasCall[]): string {
  const hash = createHash('sha256').update(JSON.stringify(calls)).digest('hex').slice(0, 16);
  return `${hash} (${String(calls.length)} calls)`;
}
