/**
 * Every JSON file in the repository must parse. JSON here is configuration
 * that changes what the map does: the kill switch, plot pins, a booth's
 * plot.json, the advent challenges, the lint baseline. A broken one fails the
 * build late or, worse, a script reads it as empty, so it is caught on the edit
 * that broke it (docs/adr/0022-lint-everything-on-edit.md). Prettier checks
 * the formatting.
 *
 * Run as `node scripts/check-json.ts [files...]`; with no files, every tracked
 * .json file.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Why `text` isn't valid JSON, or undefined when it is. */
export function jsonProblem(text: string): string | undefined {
  try {
    JSON.parse(text);
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}

/* v8 ignore start -- the command-line entry point, run by CI and the hooks */
if (process.argv[1]?.endsWith('check-json.ts')) {
  const given = process.argv.slice(2).filter((file) => file.endsWith('.json'));
  const files = given.length
    ? given
    : execFileSync('git', ['ls-files', '*.json']).toString().trim().split('\n');
  const broken = files.flatMap((file) => {
    const problem = jsonProblem(readFileSync(file, 'utf8'));
    return problem ? [`${file}: ${problem}`] : [];
  });
  if (broken.length) {
    console.error(`Invalid JSON:\n${broken.join('\n')}`);
    process.exit(1);
  }
}
/* v8 ignore stop */
