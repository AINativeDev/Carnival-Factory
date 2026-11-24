import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import disabled from '../northpole/disabled.json';
import { isAttractionId } from '../northpole/plot';
import { attractionRegistry } from './index';

const attractionsDir = import.meta.dirname;
const folders = readdirSync(attractionsDir).filter((name) =>
  statSync(join(attractionsDir, name)).isDirectory(),
);

describe('attraction registry', () => {
  it('puts every attraction folder on the map', () => {
    expect(
      attractionRegistry
        .all()
        .map((a) => a.owner)
        .sort(),
    ).toEqual([...folders].sort());
  });

  it('seeds the midway with six to eight attractions', () => {
    expect(attractionRegistry.all().length).toBeGreaterThanOrEqual(6);
    expect(attractionRegistry.all().length).toBeLessThanOrEqual(8);
  });

  it('names every attraction folder in kebab-case', () => {
    for (const folder of folders) expect(isAttractionId(folder), folder).toBe(true);
  });

  it('finds an attraction by id', () => {
    const [first] = attractionRegistry.all();
    expect(attractionRegistry.get(first.owner)).toBe(first);
  });

  it('closes the attractions a maintainer switched off', () => {
    for (const id of disabled) {
      const attraction = attractionRegistry.get(id);
      if (attraction) expect(attraction.description, id).toBe('Closed for repairs.');
    }
  });

  it('gives every attraction a name and a description', () => {
    for (const attraction of attractionRegistry.all()) {
      expect(attraction.name.trim(), attraction.owner).not.toBe('');
      expect(attraction.description.trim(), attraction.owner).not.toBe('');
    }
  });

  it('gives every attraction a README', () => {
    for (const folder of folders) {
      expect(readdirSync(join(attractionsDir, folder)), folder).toContain('README.md');
    }
  });

  it('draws every attraction at any size and time without throwing', () => {
    // Enough of a canvas context to draw with: every method does nothing.
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (target, key: string) => (key in target ? target[key] : () => {}),
      set: (target, key: string, value) => ((target[key] = value), true),
    }) as unknown as CanvasRenderingContext2D;
    for (const attraction of attractionRegistry.all()) {
      for (const size of [160, 480]) {
        for (const time of [0, 1234, 60_000]) {
          expect(() => attraction.draw(ctx, size, time), attraction.owner).not.toThrow();
        }
      }
    }
  });
});
