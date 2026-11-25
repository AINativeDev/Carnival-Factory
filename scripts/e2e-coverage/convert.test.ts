import { describe, expect, it } from 'vitest';
import { builtFile, combinedLines, ownCode, toIstanbul } from './convert';

// A tiny "bundle" as Chromium reports it: one function, called once, whose
// ?: took one side; the second run took the other as well.
const code = 'function pick(a) {\n  return a ? 1 : 2;\n}\npick(true);\n';
const fn = { start: 0, end: code.indexOf('}') + 1 };
const elseArm = { start: code.indexOf('2;'), end: code.indexOf('2;') + 1 };
const run = (elseCount: number) => [
  {
    functionName: '',
    isBlockCoverage: true,
    ranges: [{ startOffset: 0, endOffset: code.length, count: 1 }],
  },
  {
    functionName: 'pick',
    isBlockCoverage: true,
    ranges: [
      { startOffset: fn.start, endOffset: fn.end, count: 1 },
      { startOffset: elseArm.start, endOffset: elseArm.end, count: elseCount },
    ],
  },
];
const functions = run(0);

describe('toIstanbul: a browser run, back on the source files', () => {
  it('turns Chromium coverage of a script into per-file statements and branches', async () => {
    const files = await toIstanbul(
      { url: 'file:///repo/src/pick.ts', source: code, functions },
      undefined,
    );
    const branches = Object.values(files).flatMap((file) => Object.values(file.b).flat());
    expect(branches).toEqual([1, 0]);
  });
});

describe('combinedLines: a line counts if either kind of test ran it', () => {
  it('adds runs line by line, so differently split statements are never counted twice', async () => {
    const once = await toIstanbul(
      { url: 'file:///repo/src/pick.ts', source: code, functions },
      undefined,
    );
    const nothingRan = run(0).map((block) => ({
      ...block,
      ranges: block.ranges.map((range) => ({ ...range, count: 0 })),
    }));
    const none = await toIstanbul(
      { url: 'file:///repo/src/pick.ts', source: code, functions: nothingRan },
      undefined,
    );
    const lines = combinedLines([none, once]);
    expect(lines.total).toBeGreaterThan(0);
    expect(lines.covered).toBe(lines.total);
    expect(lines.files['/repo/src/pick.ts']).toEqual({ covered: lines.total, total: lines.total });
    expect(combinedLines([none]).covered).toBe(0);
  });

  it('reports nothing measured as fully covered rather than dividing by zero', () => {
    expect(combinedLines([]).percent).toBe(100);
  });
});

describe('finding the code that counts', () => {
  it('finds the built file behind a served script', () => {
    expect(builtFile('/repo', 'http://localhost:4173/assets/main-abc.js')).toBe(
      '/repo/dist/assets/main-abc.js',
    );
  });

  it("keeps only the map's own source files", () => {
    const data = {
      '/repo/src/map.ts': {},
      '/repo/node_modules/x/index.js': {},
      '/elsewhere/y.ts': {},
    };
    expect(Object.keys(ownCode('/repo', data as never))).toEqual(['/repo/src/map.ts']);
  });
});
