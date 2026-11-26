/**
 * The workflows run scripts with plain `node scripts/<name>.ts`, which strips
 * the types but, unlike Vite and Vitest, never guesses a file's extension. A
 * relative import without `.ts` passes every unit test and then fails in CI
 * with ERR_MODULE_NOT_FOUND, as the auto-merge gate did through
 * src/northpole/spots.ts (#235). So every file a workflow's script reaches,
 * in scripts/ or src/, names its imports in full.
 */
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const RELATIVE_IMPORT = /\b(?:from|import)\s*\(?\s*'(\.{1,2}\/[^']+)'/g;

/** The scripts the workflows and package.json hand to `node`. */
function entryPoints(): string[] {
  const workflows = join(ROOT, '.github/workflows');
  const sources = [
    readFileSync(join(ROOT, 'package.json'), 'utf8'),
    ...readdirSync(workflows).map((name) => readFileSync(join(workflows, name), 'utf8')),
  ];
  const found = sources.flatMap((text) => [
    ...text.matchAll(/\bnode (?:--\S+ )*(scripts\/\S+\.ts)/g),
  ]);
  return [...new Set(found.map(([, script = '']) => script))].sort();
}

/** Whether Node can load the path as written: a file, never a directory. */
function isFile(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;
}

/** Each import Node would fail to load, as "<file>: <specifier>", from `root`. */
function missingImports(entry: string, root = ROOT): string[] {
  const missing: string[] = [];
  const seen = new Set<string>();
  const queue = [join(root, entry)];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier = ''] of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT)) {
      const target = resolve(dirname(file), specifier);
      if (!isFile(target)) missing.push(`${relative(root, file)}: ${specifier}`);
      else if (target.endsWith('.ts')) queue.push(target);
    }
  }
  return missing;
}

describe('the scripts the workflows run with node', () => {
  it('are found in the workflows', () => {
    expect(entryPoints()).toContain('scripts/auto-merge-booths.ts');
  });

  it('catches a bare name or a folder reached through another file', () => {
    const root = mkdtempSync(join(tmpdir(), 'node-imports-'));
    mkdirSync(join(root, 'square-code'));
    const files: Record<string, string> = {
      'entry.ts': "import { gate } from './gate.ts';",
      'gate.ts': "import './spots';\nimport './square-code';\nimport './square-code.ts';",
      'square-code.ts': '',
    };
    for (const [name, text] of Object.entries(files)) writeFileSync(join(root, name), text);
    expect(missingImports('entry.ts', root)).toEqual([
      'gate.ts: ./spots',
      'gate.ts: ./square-code',
    ]);
  });

  it.each(entryPoints())('%s imports only files Node can find as named', (entry) => {
    expect(missingImports(entry)).toEqual([]);
  });
});
