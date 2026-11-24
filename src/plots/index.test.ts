import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import disabled from '../northpole/disabled.json';
import { registry } from './index';

const plotsDir = import.meta.dirname;
const folders = readdirSync(plotsDir).filter((name) =>
  statSync(join(plotsDir, name)).isDirectory(),
);

describe('plot registry', () => {
  it('puts every plot folder on the map', () => {
    expect(
      registry
        .all()
        .map((p) => p.owner)
        .sort(),
    ).toEqual([...folders].sort());
  });

  it('closes the plots a maintainer switched off', () => {
    for (const owner of disabled) {
      expect(registry.get(owner)?.description, owner).toBe('Closed for repairs.');
    }
  });

  it('gives every plot a name and a description', () => {
    for (const plot of registry.all()) {
      expect(plot.name.trim(), plot.owner).not.toBe('');
      expect(plot.description.trim(), plot.owner).not.toBe('');
    }
  });
});
