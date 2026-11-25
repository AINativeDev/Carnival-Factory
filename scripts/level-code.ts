/**
 * The auto-merge gate's static check on one participant's level folder,
 * `carnival/levels/<login>/` (ADR 0030). Its squares are code, so each one,
 * `squares/<id>/`, goes through the same check as a booth, from its own
 * folder. Its level.ts is plain data the page reads, so it may hold nothing
 * but the one NorthPoleLevel object, as ESLint holds it in CI. Anything else
 * in the folder, beside its Markdown, needs a person.
 */
import ts from 'typescript';
import { hiddenCharacters, injectionMarkers } from './injection-scan.ts';
import { checkSquareCode, type CodeProblem, type SourceFile } from './square-code.ts';

/** The one import a level.ts may have: the level's type, from the map. */
const LEVEL_TYPE = '../../../src/northpole/level';

/** Whether a value in level.ts is plain data: objects, arrays, strings, numbers and booleans. */
function isPlainValue(node: ts.Expression): boolean {
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) &&
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
        isPlainValue(property.initializer),
    );
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.every(isPlainValue);
  if (ts.isPrefixUnaryExpression(node)) {
    return node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand);
  }
  return (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword
  );
}

/** Whether one top-level statement of level.ts is one of the three it may have. */
function isLevelStatement(statement: ts.Statement): boolean {
  if (ts.isImportDeclaration(statement)) {
    return (
      statement.importClause?.phaseModifier === ts.SyntaxKind.TypeKeyword &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === LEVEL_TYPE
    );
  }
  if (ts.isVariableStatement(statement)) {
    const { declarations, flags } = statement.declarationList;
    const declaration = declarations.at(0);
    return (
      (flags & ts.NodeFlags.Const) !== 0 &&
      !statement.modifiers?.length &&
      declarations.length === 1 &&
      !!declaration?.initializer &&
      ts.isIdentifier(declaration.name) &&
      isPlainValue(declaration.initializer)
    );
  }
  return (
    ts.isExportAssignment(statement) &&
    !statement.isExportEquals &&
    ts.isIdentifier(statement.expression)
  );
}

/** Problems with a level.ts as plain data: each statement that isn't its import, its object or its export. */
function levelDataProblems(file: SourceFile): CodeProblem[] {
  const source = ts.createSourceFile(file.path, file.text, ts.ScriptTarget.ES2022, true);
  return source.statements
    .filter((statement) => !isLevelStatement(statement))
    .map((statement) => ({
      file: file.path,
      line: source.getLineAndCharacterOfPosition(statement.getStart(source)).line + 1,
      rule: 'level-data',
      message:
        'A level.ts holds only `import type` of its level type, one object of plain data, and its export.',
    }));
}

/** Hidden characters and text aimed at an AI, in a file that isn't a square's. */
function textProblems(file: SourceFile): CodeProblem[] {
  return [
    ...hiddenCharacters(file.text).map((found) => ({ ...found, rule: 'hidden-text' })),
    ...injectionMarkers(file.text).map((found) => ({ ...found, rule: 'injection' })),
  ].map(({ line, what, rule }) => ({ file: file.path, line, rule, message: what }));
}

/**
 * Checks every file of one level's folder (`folder`, e.g.
 * `carnival/levels/elf/`). Returns every problem found; empty means the level
 * is plain data and each square keeps to itself, as far as a static check
 * can tell.
 */
export function checkLevelCode(folder: string, files: readonly SourceFile[]): CodeProblem[] {
  const problems: CodeProblem[] = [];
  const squares = new Map<string, SourceFile[]>();
  for (const file of files) {
    const inside = file.path.slice(folder.length);
    const square = /^squares\/([a-z0-9-]+)\/./.exec(inside)?.[1];
    if (square && !file.path.endsWith('.json')) {
      squares.set(square, [...(squares.get(square) ?? []), file]);
    } else if (inside === 'level.ts') {
      problems.push(...textProblems(file), ...levelDataProblems(file));
    } else if (!square && file.path.endsWith('.md')) {
      problems.push(...textProblems(file));
    } else {
      problems.push({
        file: file.path,
        line: 0,
        rule: 'files',
        message: 'A level holds only its level.ts, its Markdown and its squares/<id>/ folders.',
      });
    }
  }
  for (const [id, own] of squares) {
    problems.push(...checkSquareCode(`${folder}squares/${id}/`, own));
  }
  return problems;
}
