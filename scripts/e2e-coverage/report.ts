/**
 * The combined coverage: the unit tests' report (coverage/coverage-final.json)
 * plus what the smoke tests ran in the browser (coverage-browser/, written by
 * smoke/coverage.ts), mapped back onto the source files and held to the floor in
 * lint/combined-coverage-floor.json (docs/adr/0032-browser-coverage-counts.md).
 * It lists the files with the most untested lines: the work still to do.
 *
 * Run after `COVERAGE=1 npm run smoke` and `npm test`:
 *   node scripts/e2e-coverage/report.ts
 * A partial smoke run (SMOKE_ONLY set) is reported but never held to the floor.
 * Outside CI, a run above the floor raises it, as the unit-test thresholds do.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CoverageMapData } from 'istanbul-lib-coverage';
import {
  builtFile,
  combinedLines,
  ownCode,
  toIstanbul,
  type ScriptCoverage,
  type SourceMap,
} from './convert.ts';
import { checkFloor } from './floor.ts';

/* v8 ignore start -- the command-line entry point; its parts are tested in convert and floor */
if (process.argv[1]?.endsWith('report.ts')) {
  const ROOT = resolve(import.meta.dirname, '..', '..');
  const FLOOR = join(ROOT, 'lint', 'combined-coverage-floor.json');
  const runs: CoverageMapData[] = [];
  const unit = join(ROOT, 'coverage', 'coverage-final.json');
  if (existsSync(unit)) runs.push(JSON.parse(readFileSync(unit, 'utf8')) as CoverageMapData);
  const browser = join(ROOT, 'coverage-browser');
  const recordings = existsSync(browser) ? readdirSync(browser) : [];
  for (const name of recordings) {
    const scripts = JSON.parse(readFileSync(join(browser, name), 'utf8')) as ScriptCoverage[];
    for (const script of scripts) {
      const file = builtFile(ROOT, script.url);
      const map = existsSync(`${file}.map`)
        ? (JSON.parse(readFileSync(`${file}.map`, 'utf8')) as SourceMap)
        : undefined;
      const data = await toIstanbul({ ...script, url: pathToFileURL(file).href }, map);
      runs.push(ownCode(ROOT, data));
    }
  }
  const lines = combinedLines(runs);
  console.log(
    `Combined line coverage, unit and ${String(recordings.length)} browser tests: ` +
      `${String(lines.covered)} of ${String(lines.total)} lines, ${String(lines.percent)}%`,
  );
  const gaps = Object.entries(lines.files)
    .map(
      ([file, { covered, total }]) =>
        [file.slice(ROOT.length + 1), total - covered, total] as const,
    )
    .filter(([, missing]) => missing > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  for (const [file, missing, total] of gaps)
    console.log(
      `  ${String(missing).padStart(5)} of ${String(total).padStart(5)} lines untested  ${file}`,
    );
  if (process.env.SMOKE_ONLY) {
    console.log('A partial smoke run: reported, not held to the floor.');
    process.exit(0);
  }
  const { lines: floor } = JSON.parse(readFileSync(FLOOR, 'utf8')) as { lines: number };
  const { below, raised } = checkFloor(lines.percent, floor);
  if (below) {
    console.error(`Combined line coverage fell below its floor: ${below}`);
    process.exit(1);
  }
  if (!process.env.CI && raised !== floor) {
    writeFileSync(FLOOR, `${JSON.stringify({ lines: raised }, null, 2)}\n`);
    console.log(
      `Raised the floor to ${String(raised)}% in lint/combined-coverage-floor.json: commit it.`,
    );
  }
}
/* v8 ignore stop */
