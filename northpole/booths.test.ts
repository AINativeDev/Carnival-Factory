import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { boothRegistry as registry } from './booths';
import disabled from './disabled.json';

const boothsDir = join(import.meta.dirname, '../booths');
const folders = readdirSync(boothsDir).filter((name) =>
  statSync(join(boothsDir, name)).isDirectory(),
);

describe('booth registry', () => {
  it('puts every booth folder on the map', () => {
    expect(
      registry
        .all()
        .map((p) => p.id)
        .sort(),
    ).toEqual([...folders].sort());
  });

  it('closes the booths a maintainer switched off', () => {
    for (const login of disabled.booths) {
      const booth = registry.get(login);
      if (booth) expect(booth.description, login).toBe('Closed for repairs.');
    }
  });

  it('gives every booth a name and a description', () => {
    for (const booth of registry.all()) {
      expect(booth.name.trim(), booth.id).not.toBe('');
      expect(booth.description.trim(), booth.id).not.toBe('');
    }
  });
});
