/**
 * The text checks on every file of a square, code or not: hidden characters
 * that make code read differently from how it runs, and text written to talk
 * a reviewer or an agent into approving it (scripts/injection-scan.ts).
 */
import { hiddenCharacters, injectionMarkers } from '../injection-scan.ts';
import type { CodeProblem, SourceFile } from './problems.ts';

export function hiddenTextProblems(files: readonly SourceFile[]): CodeProblem[] {
  const problems: CodeProblem[] = [];
  for (const file of files) {
    for (const found of hiddenCharacters(file.text)) {
      problems.push({
        file: file.path,
        line: found.line,
        rule: 'hidden-text',
        message: found.what,
      });
    }
    for (const found of injectionMarkers(file.text)) {
      problems.push({ file: file.path, line: found.line, rule: 'injection', message: found.what });
    }
  }
  return problems;
}
