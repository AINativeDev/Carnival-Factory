import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { namedPaths } from './docs-paths';

describe('namedPaths', () => {
  it('finds repository paths in backticks, not patterns or other code', () => {
    const doc =
      'See `src/northpole/world.ts`, `carnival/booths/<login>/`, `docs/specs/`, `npm run check` and `src/*.ts`.';
    expect(namedPaths(doc)).toEqual(['docs/specs', 'src/northpole/world.ts']);
  });
});

const root = join(import.meta.dirname, '..');
const docs = [
  'AGENTS.md',
  'README.md',
  ...['docs/specs', 'docs/adr'].flatMap((dir) =>
    readdirSync(join(root, dir)).map((name) => `${dir}/${name}`),
  ),
];

describe('the docs name only files that exist', () => {
  it.each(docs)('%s', (doc) => {
    const missing = namedPaths(readFileSync(join(root, doc), 'utf8')).filter(
      (path) => !existsSync(join(root, path)),
    );
    expect(missing).toEqual([]);
  });
});

describe('the ADR index', () => {
  it('lists every decision record', () => {
    const index = readFileSync(join(root, 'docs/adr/README.md'), 'utf8');
    const records = readdirSync(join(root, 'docs/adr')).filter((name) => /^\d{4}-/.test(name));
    expect(records.filter((name) => !index.includes(`(${name})`))).toEqual([]);
  });
});
