import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkSquareCode } from './square-code.ts';
import { fine, problems, rules } from './square-code/test-booth.ts';

// Each rule family has its own tests in scripts/square-code/; these hold the
// check as a whole: a booth that only draws passes, and every square on the
// map does too.
const root = join(import.meta.dirname, '..');

describe('checkSquareCode', () => {
  it('passes a booth that only draws', () => {
    expect(rules(fine)).toEqual([]);
  });

  it('passes a square with no files, and ignores files that are not code or JSON', () => {
    expect(checkSquareCode('carnival/booths/grinch/', [])).toEqual([]);
    expect(rules(fine, { 'notes.txt': 'fetch(window)' })).toEqual([]);
  });

  it('says which file and line each problem is on', () => {
    expect(problems(`export const a = 1;\nexport const x = () => fetch;`)).toEqual([
      {
        file: 'carnival/booths/grinch/booth.ts',
        line: 2,
        rule: 'global',
        message: "Uses fetch: a square only draws on the canvas it's given.",
      },
    ]);
  });

  it('holds a global the square declares again, merged with the real one', () => {
    const merged = `/// <reference lib="dom" />\ndeclare global { function fetch(u: number): void; }\nexport const x = () => fetch(1);`;
    expect(problems(merged)).toContainEqual({
      file: 'carnival/booths/grinch/booth.ts',
      line: 3,
      rule: 'global',
      message: "Uses fetch: a square only draws on the canvas it's given.",
    });
    // Reading the DOM's types takes longer than a test's default 5 s on a busy machine.
  }, 60_000);

  it('checks every code file in the folder, not only booth.ts', () => {
    const found = problems(fine, { 'lib/sky.ts': `export const x = () => eval('1');` });
    expect(found.map((problem) => [problem.file, problem.rule])).toEqual([
      ['carnival/booths/grinch/lib/sky.ts', 'global'],
    ]);
  });
});

describe('every real booth and attraction', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) =>
      statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name)],
    );
  for (const kind of ['booths', 'attractions']) {
    for (const name of readdirSync(join(root, 'carnival', kind))) {
      if (!statSync(join(root, 'carnival', kind, name)).isDirectory()) continue;
      it(`carnival/${kind}/${name}/ passes the code check`, () => {
        const folder = `carnival/${kind}/${name}/`;
        const files = walk(join(root, folder)).map((path) => ({
          path: path.slice(root.length + 1),
          text: readFileSync(path, 'utf8'),
        }));
        expect(checkSquareCode(folder, files)).toEqual([]);
      });
    }
  }
});
