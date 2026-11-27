/**
 * The deterministic code check for a booth: reads its source with the
 * TypeScript compiler (parsing and type checking only, never running it) and
 * reports anything that could reach outside the booth's own square. It's
 * stricter than the ESLint house rules, because it decides whether a booth may
 * merge without a person looking, so when in doubt it says no.
 *
 * Plain functions, so they can be tested on made-up booths; the auto-merge
 * gate runs them on a pull request's files, fetched as text. Each family of
 * rules lives in its own file in scripts/square-code/; this one runs them all.
 */
import ts from 'typescript';
import { hiddenTextProblems } from './square-code/text-checks.ts';
import { checkImports } from './square-code/imports.ts';
import { checkLoadTimeCode, checkTopLevel } from './square-code/loading.ts';
import { jsonFileProblems } from './square-code/spot-file.ts';
import type { CodeProblem, SourceFile, SquareFile } from './square-code/problems.ts';
import { checkReach } from './square-code/reach.ts';
import { squareProgram } from './square-code/square-program.ts';
import { checkSyntax } from './square-code/syntax.ts';
import { toolConfigProblems } from './square-code/tool-config.ts';

export { BANNED_GLOBALS, BANNED_PROPERTIES } from './square-code/banned-names.ts';
export { isSpotFile, spotFileProblems } from './square-code/spot-file.ts';
export type { CodeProblem, SourceFile } from './square-code/problems.ts';

/**
 * Checks every source file of one square (a booth's folder, given as
 * `folder`, e.g. `carnival/booths/elf/`). Returns every problem found; empty means the
 * code keeps to its square as far as a static check can tell.
 */
export function checkSquareCode(folder: string, files: readonly SourceFile[]): CodeProblem[] {
  const problems: CodeProblem[] = [
    ...hiddenTextProblems(files),
    ...jsonFileProblems(folder, files),
    ...toolConfigProblems(files),
  ];
  const sources = files.filter((file) => file.path.endsWith('.ts'));
  const program = squareProgram(sources);
  const checker = program.getTypeChecker();
  const ownFiles = new Set(sources.map((file) => `/${file.path}`));
  const declaredHere = (node: ts.Identifier) => {
    // In `{ fetch }` the name is the object's own property, declared right
    // here; what it hands on is the value it names, which may be a global.
    // Only the name: a default, as in `{ value = postMessage }`, is its own.
    const symbol =
      ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
        ? checker.getShorthandAssignmentValueSymbol(node.parent)
        : checker.getSymbolAtLocation(node);
    return (
      !!symbol?.declarations?.length &&
      symbol.declarations.every((d) => ownFiles.has(d.getSourceFile().fileName))
    );
  };

  // In the order the files were given, as the gate lists them.
  // Stryker disable MethodExpression,ConditionalExpression: the program holds every source it was given, so none is ever missing.
  const ownSources = sources
    .map((file) => program.getSourceFile(`/${file.path}`))
    .filter((source): source is ts.SourceFile => source !== undefined);
  // Stryker restore MethodExpression,ConditionalExpression
  for (const source of ownSources) {
    const square: SquareFile = {
      folder,
      path: source.fileName.slice(1),
      checker,
      declaredHere,
      report: (node, rule, message) => {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        problems.push({ file: source.fileName.slice(1), line: line + 1, rule, message });
      },
    };
    checkTopLevel(source, square);
    const visit = (node: ts.Node) => {
      checkLoadTimeCode(node, square);
      checkImports(node, square);
      checkReach(node, square);
      checkSyntax(node, square);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return problems;
}
