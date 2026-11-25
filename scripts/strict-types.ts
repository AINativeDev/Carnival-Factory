/**
 * Holds every file to its count of errors under the strictest TypeScript flags
 * (tsconfig.strict.json), so new code is written strict and old code can only
 * get stricter (docs/adr/0027-strict-typescript.md). A file over its count fails;
 * a file under it fails too, until the baseline is lowered, so the slack never
 * lets an error back in; files in carnival/ only have to stay within it.
 * `--update` writes the current counts.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export const BASELINE = 'lint/strict-types-baseline.json';

/** Errors per file, from `tsc --pretty false` output. */
export function errorsByFile(output: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const match of output.matchAll(/^(.+?)\(\d+,\d+\): error TS\d+/gm)) {
    counts[match[1]] = (counts[match[1]] ?? 0) + 1;
  }
  return counts;
}

/** The compiler's lines about the given files, so a failure shows only what's new. */
export function linesAbout(output: string, files: string[]): string {
  return output
    .split('\n')
    .filter((line) => files.some((file) => line.startsWith(`${file}(`)))
    .join('\n');
}

/** What differs from the baseline: files with new errors, and files that improved. */
export function compare(now: Record<string, number>, baseline: Record<string, number>) {
  const worse: string[] = [];
  const better: string[] = [];
  for (const file of new Set([...Object.keys(now), ...Object.keys(baseline)])) {
    const [count, allowed] = [now[file] ?? 0, baseline[file] ?? 0];
    if (count > allowed) worse.push(`${file}: ${count} strict type errors, ${allowed} allowed`);
    // A booth's pull request can't edit the baseline, which lives outside its
    // folder, so carnival files only have to stay within it.
    if (count < allowed && !file.startsWith('carnival/'))
      better.push(`${file}: ${count} now, baseline says ${allowed}`);
  }
  return { worse, better };
}

/* v8 ignore start -- the command-line entry point, run by CI and the hooks */
if (process.argv[1]?.endsWith('strict-types.ts')) {
  let output = '';
  try {
    execFileSync('npx', ['tsc', '-p', 'tsconfig.strict.json', '--pretty', 'false'], {
      stdio: 'pipe',
    });
  } catch (error) {
    output = String((error as { stdout?: Buffer }).stdout ?? '');
  }
  const now = errorsByFile(output);
  if (process.argv.includes('--update')) {
    const sorted = Object.fromEntries(Object.entries(now).sort());
    writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 2)}\n`);
    process.exit(0);
  }
  const { worse, better } = compare(now, JSON.parse(readFileSync(BASELINE, 'utf8')));
  const worseFiles = worse.map((line) => line.slice(0, line.indexOf(':')));
  if (worse.length)
    console.error(
      `New strict type errors:\n${worse.join('\n')}\n\n${linesAbout(output, worseFiles)}`,
    );
  if (better.length)
    console.error(
      `Fewer strict type errors than the baseline. Run node scripts/strict-types.ts --update:\n${better.join('\n')}`,
    );
  if (worse.length || better.length) process.exit(1);
}
/* v8 ignore stop */
