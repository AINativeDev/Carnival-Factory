/**
 * Syntax a square has no use for, and a canvas of its own: a square draws
 * only on the context it's given, and the map sends that to the page.
 */
import ts from 'typescript';
import type { SquareFile } from './problems.ts';

export function checkSyntax(node: ts.Node, { report }: SquareFile): void {
  if (ts.isWithStatement(node) || ts.isDebuggerStatement(node)) {
    report(node, 'syntax', `No ${ts.isWithStatement(node) ? 'with' : 'debugger'} statements.`);
  }
  if (ts.isTaggedTemplateExpression(node)) {
    report(node, 'syntax', 'No tagged templates: they call a function with raw text.');
  }
  if (
    ts.isNewExpression(node) &&
    ts.isIdentifier(node.expression) &&
    /Canvas$/.test(node.expression.text)
  ) {
    report(
      node,
      'global',
      `Creates a ${node.expression.text}: a square draws only on the one it's given.`,
    );
  }
}
