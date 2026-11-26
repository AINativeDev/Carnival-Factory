/**
 * A booth's one JSON file, its spot.json: it holds only the spot its
 * construction site held, and only a new booth's first pull request writes it,
 * so a booth never moves (docs/specs/construction-sites.md).
 */
import { readSpotFile } from '../../src/northpole/spots.ts';
import type { CodeProblem, SourceFile } from './problems.ts';

/** Whether a booth's spot.json is small, and holds only a spot number and maybe an issue number. */
export function isSpotFile(text: string): boolean {
  if (text.length > 64) return false;
  try {
    const value = JSON.parse(text) as unknown;
    const spot = readSpotFile(value);
    return !!spot && Object.keys(value as object).length === Object.keys(spot).length;
  } catch {
    return false;
  }
}

/**
 * The only other file a booth's code check lets through: its own spot.json,
 * a single spot number and maybe its request's issue number, and nothing else.
 */
export function jsonFileProblems(folder: string, files: readonly SourceFile[]): CodeProblem[] {
  const problems: CodeProblem[] = [];
  for (const file of files) {
    if (!file.path.endsWith('.json')) continue;
    if (file.path !== `${folder}spot.json`) {
      problems.push({
        file: file.path,
        line: 0,
        rule: 'files',
        message: 'The only JSON file a booth has is its own spot.json.',
      });
    } else if (!isSpotFile(file.text)) {
      problems.push({
        file: file.path,
        line: 0,
        rule: 'spot-file',
        message: 'spot.json holds only { "spot": <number> }, and maybe "issue": <number>.',
      });
    }
  }
  return problems;
}

/**
 * Whether a pull request adds, changes or removes a booth's spot.json when the
 * booth isn't new. Only a new booth's first pull request, the one that adds
 * its booth.ts, writes the spot its construction site held; after that the
 * file never changes, so a booth never moves. `files` is the pull request's
 * changed files, with GitHub's status for each.
 */
export function spotFileProblems(
  folder: string,
  files: readonly { filename: string; status: string; previous_filename?: string }[],
): CodeProblem[] {
  const spot = `${folder}spot.json`;
  const touched = files.some((file) => file.filename === spot || file.previous_filename === spot);
  const isNew = files.some(
    (file) => file.filename === `${folder}booth.ts` && file.status === 'added',
  );
  if (!touched || isNew) return [];
  return [
    {
      file: spot,
      line: 0,
      rule: 'spot-file',
      message:
        "Only a new booth's first pull request writes spot.json: changing it needs a person.",
    },
  ];
}
