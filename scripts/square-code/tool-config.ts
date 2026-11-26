/**
 * A tool's config file inside a square's folder. ESLint, Prettier and
 * markdownlint each read a config they find beside the files they check, so
 * one there could switch the house rules off for the square it sits in. A
 * square has none of its own; the gate sends one to a person.
 */
import type { CodeProblem, SourceFile } from './problems.ts';

/** `<tool>.config.<ts|js|…>`, a dotfile such as `.prettierrc`, or a `tsconfig*.json`. */
const TOOL_CONFIG = /(?:^|\/)(?:[^/]+\.config\.[cm]?[jt]sx?|\.[^/]+|tsconfig[^/]*\.json)$/;

export function toolConfigProblems(files: readonly SourceFile[]): CodeProblem[] {
  return files
    .filter((file) => TOOL_CONFIG.test(file.path))
    .map((file) => ({
      file: file.path,
      line: 0,
      rule: 'tool-config',
      message:
        "A tool's config file can change how the checks run, so a square has none of its own.",
    }));
}
