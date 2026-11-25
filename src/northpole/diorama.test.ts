import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { arcSteps, cone, drum, stringLights } from './diorama';

/** A context that counts its calls, and gives up if they run away. */
function countingContext() {
  let calls = 0;
  const ctx = new Proxy(
    {},
    {
      get: (_target, key) => {
        if (key === 'calls') return calls;
        if (key === 'createLinearGradient' || key === 'createRadialGradient') {
          return () => ({ addColorStop() {} });
        }
        return () => {
          if (++calls > 100_000) throw new Error('runaway drawing');
        };
      },
      set: () => true,
    },
  );
  return ctx as unknown as CanvasRenderingContext2D & { calls: number };
}

describe('arcSteps', () => {
  it('gives five angles from one end to the other', () => {
    expect(arcSteps(0, 1)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(arcSteps(1, 0)).toEqual([1, 0.75, 0.5, 0.25, 0]);
  });

  it('stays at five however thin the arc is', () => {
    const from = Math.PI - 1.78e-15;
    expect(arcSteps(from, Math.PI)).toHaveLength(5);
  });
});

describe('drum and cone', () => {
  it('finish a stripe clipped to a sliver at the edge of the front half', () => {
    // The carousel's sector 18 of 24 lands a hair under 3 PI at some times.
    const base = 3 * Math.PI - (18 / 24) * Math.PI * 2;
    const ctx = countingContext();
    for (let d = -20; d <= 20; d++) {
      drum(ctx, 50, 50, 34, 4, ['a', 'b'], 12, base + d * 1e-15, 'c');
      cone(ctx, 50, 40, 35, 24, ['a', 'b'], 12, base + d * 1e-15);
    }
    expect(ctx.calls).toBeLessThan(100_000);
  });
});

describe('the diorama files', () => {
  // Every booth may import them, so they must never reach the rest of the map.
  it('import nothing but ./theme and each other', () => {
    const files = readdirSync(import.meta.dirname).filter((name) =>
      /^diorama(-[a-z]+)?\.ts$/.test(name),
    );
    expect(files).toContain('diorama.ts');
    for (const file of files) {
      const source = readFileSync(join(import.meta.dirname, file), 'utf8');
      const imports = [
        ...source.matchAll(/\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g),
        ...source.matchAll(/\bimport\s*['"]([^'"]+)['"]/g),
        ...source.matchAll(/\bimport\s*\(/g),
        ...source.matchAll(/\brequire\s*\(/g),
      ].map((match) => match[1] ?? match[0]);
      for (const target of imports) expect(target, file).toMatch(/^\.\/(theme|diorama-[a-z]+)$/);
    }
  });
});

describe('stripes and bulbs with no colours', () => {
  it('keep the fill they had rather than setting none', () => {
    const calls = drawingOf((ctx) => {
      drum(ctx, 50, 50, 20, 6, [], 4, 0, 'top');
      cone(ctx, 50, 40, 20, 12, [], 4, 0);
      stringLights(ctx, [{ x: 1, y: 2 }], [], 0);
    });
    expect(calls.filter(([name]) => name === '=fillStyle').map(([, value]) => value)).not.toContain(
      undefined,
    );
  });
});
