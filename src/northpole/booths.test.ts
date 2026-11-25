import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { boothRegistry as registry } from './booths';
import disabled from './disabled.json';
import { fromFolders, type NorthPoleSquare } from './square';

const boothsDir = join(import.meta.dirname, '../carnival/booths');
const folders = readdirSync(boothsDir).filter((name) =>
  statSync(join(boothsDir, name)).isDirectory(),
);
// The booths' own code, which the page never runs: only their frames do.
const modules = import.meta.glob<NorthPoleSquare | undefined>('../carnival/booths/*/booth.ts', {
  eager: true,
  import: 'default',
});

describe('booth registry', () => {
  it('puts every booth folder on the map', () => {
    expect(registry.all().map((booth) => booth.id)).toEqual([...folders].sort());
  });

  it('closes the booths a maintainer switched off', () => {
    for (const login of disabled.booths) {
      const booth = registry.get(login);
      if (booth) expect(booth.description, login).toBe('Closed for repairs.');
    }
  });
});

describe('every booth', () => {
  it("exports its NorthPoleSquare with its folder's name as its id", () => {
    expect(fromFolders(modules).map((booth) => booth.id)).toEqual([...folders].sort());
  });

  it('has a name and a description', () => {
    for (const booth of fromFolders(modules)) {
      expect(booth.name.trim(), booth.id).not.toBe('');
      expect(booth.description.trim(), booth.id).not.toBe('');
    }
  });
});
