/**
 * A booth's one JSON file, its plot.json: it holds only the plot its
 * construction site held, and only a new booth's first pull request writes it,
 * so a booth never moves (docs/specs/construction-sites.md).
 */
import { readPlotFile } from '../../src/northpole/plots.ts';
import type { CodeProblem, SourceFile } from './problems.ts';

/** Whether a booth's plot.json is small, and holds only a plot number and maybe an issue number. */
export function isPlotFile(text: string): boolean {
  if (text.length > 64) return false;
  try {
    const value = JSON.parse(text) as unknown;
    const plot = readPlotFile(value);
    return !!plot && Object.keys(value as object).length === Object.keys(plot).length;
  } catch {
    return false;
  }
}

/**
 * The only other file a booth's code check lets through: its own plot.json,
 * a single plot number and maybe its request's issue number, and nothing else.
 */
export function jsonFileProblems(folder: string, files: readonly SourceFile[]): CodeProblem[] {
  const problems: CodeProblem[] = [];
  for (const file of files) {
    if (!file.path.endsWith('.json')) continue;
    if (file.path !== `${folder}plot.json`) {
      problems.push({
        file: file.path,
        line: 0,
        rule: 'files',
        message: 'The only JSON file a booth has is its own plot.json.',
      });
    } else if (!isPlotFile(file.text)) {
      problems.push({
        file: file.path,
        line: 0,
        rule: 'plot-file',
        message: 'plot.json holds only { "plot": <number> }, and maybe "issue": <number>.',
      });
    }
  }
  return problems;
}

/**
 * Whether a pull request adds, changes or removes a booth's plot.json when the
 * booth isn't new. Only a new booth's first pull request, the one that adds
 * its booth.ts, writes the plot its construction site held; after that the
 * file never changes, so a booth never moves. `files` is the pull request's
 * changed files, with GitHub's status for each.
 */
export function plotFileProblems(
  folder: string,
  files: readonly { filename: string; status: string; previous_filename?: string }[],
): CodeProblem[] {
  const plot = `${folder}plot.json`;
  const touched = files.some((file) => file.filename === plot || file.previous_filename === plot);
  const isNew = files.some(
    (file) => file.filename === `${folder}booth.ts` && file.status === 'added',
  );
  if (!touched || isNew) return [];
  return [
    {
      file: plot,
      line: 0,
      rule: 'plot-file',
      message:
        "Only a new booth's first pull request writes plot.json: changing it needs a person.",
    },
  ];
}
