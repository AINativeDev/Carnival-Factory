/**
 * The ways a square could reach outside its own drawing: a banned global, a
 * banned property, a banned name written as a string, and a computed key that
 * isn't a number, which could be any of them built at run time.
 */
import ts from 'typescript';
import { BANNED_GLOBALS, BANNED_PROPERTIES, NOT_A_GLOBAL } from './banned-names.ts';
import { isNameOnly } from './names.ts';
import type { SquareFile } from './problems.ts';

export function checkReach(node: ts.Node, { checker, report, declaredHere }: SquareFile): void {
  if (
    ts.isIdentifier(node) &&
    BANNED_GLOBALS.has(node.text) &&
    !isNameOnly(node) &&
    !declaredHere(node)
  ) {
    report(node, 'global', `Uses ${node.text}: a square only draws on the canvas it's given.`);
  }
  if (
    (ts.isPropertyAccessExpression(node) && BANNED_PROPERTIES.has(node.name.text)) ||
    (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === '__proto__')
  ) {
    const name = ts.isPropertyAccessExpression(node) ? node.name.text : '__proto__';
    report(node, 'property', `Uses .${name}, a way out of the square.`);
  }
  if (
    ts.isStringLiteralLike(node) &&
    NOT_A_GLOBAL.has(node.text) &&
    !ts.isImportDeclaration(node.parent)
  ) {
    report(node, 'string', `The string "${node.text}" names something a square may not reach.`);
  }
  if (ts.isElementAccessExpression(node)) {
    const type = checker.getTypeAtLocation(node.argumentExpression);
    if ((type.flags & ts.TypeFlags.NumberLike) === 0) {
      report(
        node,
        'computed-access',
        'Computed property access must use a number index: a string key can reach anything.',
      );
    }
  }
}
