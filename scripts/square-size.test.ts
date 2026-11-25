import { mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ASSET_BUDGET, CODE_BUDGET, measureSquare, overBudget } from './square-size';

const root = join(import.meta.dirname, '..');

function folder(files: Record<string, string | Buffer>): string {
  const dir = mkdtempSync(join(tmpdir(), 'square-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

describe('measureSquare', () => {
  it('counts code gzipped, and leaves out tests and the README', () => {
    const size = measureSquare(
      folder({
        'booth.ts': 'export const a = 1;\n'.repeat(1000),
        'booth.test.ts': randomBytes(100_000),
        'README.md': randomBytes(100_000),
      }),
    );
    expect(size.code).toBeGreaterThan(0);
    expect(size.code).toBeLessThan(1024);
    expect(size.assets).toBe(0);
  });

  it('counts other files, in nested folders too, as assets', () => {
    const size = measureSquare(folder({ 'booth.ts': '', 'img/snow.png': randomBytes(3000) }));
    expect(size.assets).toBe(3000);
  });

  it('counts no code for a square with none', () => {
    expect(measureSquare(folder({ 'snow.png': randomBytes(10) })).code).toBe(0);
  });
});

describe('overBudget', () => {
  it('passes a square within budget', () => {
    expect(overBudget({ code: CODE_BUDGET, assets: ASSET_BUDGET })).toEqual([]);
  });

  it('says what is over', () => {
    expect(overBudget({ code: CODE_BUDGET + 1, assets: ASSET_BUDGET + 1 })).toEqual([
      'its code is 51 KB gzipped, over the 50 KB budget',
      'its other files are 201 KB, over the 200 KB budget',
    ]);
  });
});

describe('every booth, attraction and level', () => {
  for (const kind of ['booths', 'attractions', 'levels']) {
    for (const name of readdirSync(join(root, 'carnival', kind))) {
      const dir = join(root, 'carnival', kind, name);
      if (!statSync(dir).isDirectory()) continue;
      it(`carnival/${kind}/${name}/ fits the size budget`, () => {
        expect(overBudget(measureSquare(dir))).toEqual([]);
      });
    }
  }
});
