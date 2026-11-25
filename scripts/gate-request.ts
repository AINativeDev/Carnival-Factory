/**
 * What the auto-merge gate needs to know about a request, booth or level
 * alike (ADR 0030): which kind it is, which files its folder may hold without
 * a person, the static checks on its code, and the note when it lands. Plain
 * functions, so scripts/auto-merge-booths.ts, which talks to GitHub, stays
 * thin and these rules are tested.
 */
import type { GateKind } from './booth-gate.ts';
import { checkLevelCode } from './level-code.ts';
import {
  checkSquareCode,
  plotFileProblems,
  type CodeProblem,
  type SourceFile,
} from './square-code.ts';

/** The only kinds of file a booth or level may hold and still merge without a person. */
const TEXT_FILES = /\.(ts|md)$/;
/** A link in git's tree, which could point anywhere. */
const SYMLINK = '120000';

/** Whether an issue is a booth request or a level request, from its labels; neither or both is neither. */
export function requestKind(labels: readonly string[]): GateKind | undefined {
  const booth = labels.includes('booth-request');
  const level = labels.includes('level-request');
  if (booth === level) return undefined;
  return booth ? 'booth' : 'level';
}

/** Whether a file in the folder, by its path and git mode, can merge with no person looking. */
export function mergesWithoutPerson(kind: GateKind, folder: string, path: string, mode: string) {
  if (mode === SYMLINK) return false;
  return TEXT_FILES.test(path) || (kind === 'booth' && path === `${folder}plot.json`);
}

/**
 * The static checks on a booth's or level's folder at the head commit: for a
 * booth, its plot.json and its code; for a level, its plain data and each of
 * its squares. `changed` is the pull request's changed files with GitHub's
 * status for each.
 */
export function folderCodeProblems(
  kind: GateKind,
  folder: string,
  changed: readonly { filename: string; status: string; previous_filename?: string }[],
  files: readonly SourceFile[],
): CodeProblem[] {
  if (kind === 'level') return checkLevelCode(folder, files);
  return [...plotFileProblems(folder, changed), ...checkSquareCode(folder, files)];
}

/** The comment that closes a request once its pull request merged on its own. */
export function landedNote(kind: GateKind, pull: number, guide: string): string {
  return `Your ${kind} is on the map. It merged on its own in #${pull} after passing every check in the auto-merge gate. [How your request is built](${guide}) explains each one.`;
}
