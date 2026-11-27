/**
 * Browser coverage, back on the source files: Chromium reports which byte ranges
 * of the built bundle ran during the smoke tests, and this maps them through the
 * build's source maps onto `src/`, the same way Vitest maps its own runs, so the
 * two can be added together (docs/adr/0032-browser-coverage-counts.md).
 */
import convert from 'ast-v8-to-istanbul';
import libCoverage, { type CoverageMapData } from 'istanbul-lib-coverage';
import { join } from 'node:path';
import { parse } from 'vite';

/** One script's coverage as Chromium's profiler gives it, with the script's source. */
export interface ScriptCoverage {
  url: string;
  source: string;
  functions: {
    functionName: string;
    isBlockCoverage: boolean;
    ranges: { startOffset: number; endOffset: number; count: number }[];
  }[];
}

/** A built script's source map, as Vite writes it beside the script. */
export type SourceMap = Parameters<typeof convert>[0]['sourceMap'];

/** One script's coverage, per source file; `sourceMap` maps the bundle back to `src/`. */
export async function toIstanbul(
  script: ScriptCoverage,
  sourceMap: SourceMap,
): Promise<CoverageMapData> {
  return convert({
    code: script.source,
    ...(sourceMap ? { sourceMap } : {}),
    // Vite's parser returns the same ESTree program the converter reads, under another type name.
    // Stryker disable next-line StringLiteral: the name only tells the parser the language, and plain JavaScript is its default.
    ast: parse('bundle.js', script.source).then(({ program }) => program as never),
    coverage: { url: script.url, functions: script.functions },
  });
}

/** Lines covered out of lines with code, across files and per file. */
export interface LineCoverage {
  covered: number;
  total: number;
  percent: number;
  files: Record<string, { covered: number; total: number }>;
}

/**
 * Several runs added together line by line: a line with code counts as covered
 * if any run ran it. The unit tests and the browser bundle split the same source
 * into differently shaped statements and branches, so merging those would count
 * one piece of code twice; lines are the measure both agree on.
 */
export function combinedLines(runs: CoverageMapData[]): LineCoverage {
  const hits = new Map<string, Map<number, boolean>>();
  for (const run of runs) {
    for (const [file, data] of Object.entries(run)) {
      const lines = hits.get(file) ?? new Map<number, boolean>();
      hits.set(file, lines);
      for (const [line, count] of Object.entries(
        libCoverage.createFileCoverage(data).getLineCoverage(),
      ))
        lines.set(Number(line), (lines.get(Number(line)) ?? false) || count > 0);
    }
  }
  const files: LineCoverage['files'] = {};
  let covered = 0;
  let total = 0;
  for (const [file, lines] of hits) {
    const hit = [...lines.values()].filter(Boolean).length;
    files[file] = { covered: hit, total: lines.size };
    covered += hit;
    total += lines.size;
  }
  const percent = total === 0 ? 100 : Math.round((covered / total) * 10000) / 100;
  return { covered, total, percent, files };
}

/** Where a script the preview server served was built, so its source map is found beside it. */
export const builtFile = (root: string, url: string) =>
  // Stryker disable next-line Regex: a pathname starts with its slashes, and join drops any it keeps.
  join(root, 'dist', new URL(url).pathname.replace(/^\/+/, ''));

/** Only the map's own code counts: never a dependency the bundle carries along. */
export const ownCode = (root: string, data: CoverageMapData): CoverageMapData =>
  Object.fromEntries(
    Object.entries(data).filter(
      ([file]) => file.startsWith(join(root, 'src')) && !file.includes('node_modules'),
    ),
  );
