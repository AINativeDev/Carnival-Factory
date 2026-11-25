import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { attractionRegistry } from './attractions';
import disabled from './disabled.json';
import { attractionShown } from '../feature-flag-names';
import { FEATURE_FLAGS } from '../feature-flags';
import { fromFolders, isAttractionId, type NorthPoleSquare } from './square';

const attractionsDir = join(import.meta.dirname, '../../carnival/attractions');
const folders = readdirSync(attractionsDir).filter((name) =>
  statSync(join(attractionsDir, name)).isDirectory(),
);

// The attractions' own code, which the page never runs: only their frames do.
const modules = import.meta.glob<NorthPoleSquare | undefined>(
  '../../carnival/attractions/*/attraction.ts',
  {
    eager: true,
    import: 'default',
  },
);
const squares = fromFolders(modules);

describe('attraction registry', () => {
  it('puts every attraction folder on the map but those a feature flag holds back', () => {
    expect(
      attractionRegistry
        .all()
        .map((a) => a.id)
        .sort(),
    ).toEqual(folders.filter((id) => attractionShown(id, FEATURE_FLAGS)).sort());
    // The live build, like the tests, leaves the Gift Shop out (docs/adr/0046-launch-behind-feature-flags.md).
    expect(attractionRegistry.get('gift-shop')).toBeUndefined();
  });

  // Two rings of plots round the town square: sixteen keeps them all in the first two rows.
  it('seeds the midway with six to sixteen attractions', () => {
    expect(attractionRegistry.all().length).toBeGreaterThanOrEqual(6);
    expect(attractionRegistry.all().length).toBeLessThanOrEqual(16);
  });

  it('names every attraction folder in kebab-case', () => {
    for (const folder of folders) expect(isAttractionId(folder), folder).toBe(true);
  });

  it('finds an attraction by id', () => {
    const [first] = attractionRegistry.all();
    expect(attractionRegistry.get(first.id)).toBe(first);
  });

  it('closes the attractions a maintainer switched off', () => {
    for (const id of disabled.attractions) {
      const attraction = attractionRegistry.get(id);
      if (attraction) expect(attraction.description, id).toBe('Closed for repairs.');
    }
  });

  it('gives every attraction a name and a description', () => {
    for (const attraction of squares) {
      expect(attraction.name.trim(), attraction.id).not.toBe('');
      expect(attraction.description.trim(), attraction.id).not.toBe('');
    }
  });

  it('gives every attraction a README', () => {
    for (const folder of folders) {
      expect(readdirSync(join(attractionsDir, folder)), folder).toContain('README.md');
    }
  });

  it('draws every attraction at any size and time without throwing', () => {
    // Enough of a canvas context to draw with: every method does nothing, and
    // returns another of the same, so a gradient takes its colour stops too.
    const ctx: CanvasRenderingContext2D = new Proxy({} as Record<string, unknown>, {
      get: (target, key: string) => (key in target ? target[key] : () => ctx),
      set: (target, key: string, value) => ((target[key] = value), true),
    }) as unknown as CanvasRenderingContext2D;
    for (const attraction of squares) {
      for (const size of [160, 480]) {
        for (const time of [0, 1234, 60_000]) {
          expect(() => attraction.draw(ctx, size, time), attraction.id).not.toThrow();
        }
      }
    }
  });
});
