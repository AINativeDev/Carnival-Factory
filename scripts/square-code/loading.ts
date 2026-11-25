/**
 * Loading a square must do nothing but define it: only declarations at the
 * top level, and no code hidden inside one that runs as it loads, such as an
 * immediately-invoked function or a class's static block.
 */
import ts from 'typescript';
import { isTest, type SquareFile } from './problems.ts';

export function checkTopLevel(source: ts.SourceFile, { path, report }: SquareFile): void {
  for (const statement of source.statements) {
    const allowed =
      ts.isImportDeclaration(statement) ||
      ts.isVariableStatement(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isExportAssignment(statement) ||
      ts.isExportDeclaration(statement) ||
      (isTest(path) && ts.isExpressionStatement(statement));
    if (!allowed) {
      report(
        statement,
        'top-level',
        'Only declarations at the top level: loading a square should only define it.',
      );
    }
  }
}

export function checkLoadTimeCode(node: ts.Node, { report }: SquareFile): void {
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    let callee: ts.Expression = node.expression;
    while (ts.isParenthesizedExpression(callee)) callee = callee.expression;
    if (ts.isFunctionExpression(callee) || ts.isArrowFunction(callee)) {
      report(
        node,
        'top-level',
        'No immediately-invoked functions: loading a square must not run anything.',
      );
    }
  }
  if (ts.isClassStaticBlockDeclaration(node)) {
    report(node, 'top-level', 'No static blocks: loading a square must not run anything.');
  }
}
