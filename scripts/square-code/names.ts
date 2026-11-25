/**
 * Telling a reference to a global from a name that only looks like one: a
 * property, a member, a label or an import's name. The banned-globals rule
 * stops only references, so `ctx.close()` and `{ top: 1 }` stay allowed.
 */
import ts from 'typescript';

/** Is this identifier a name being declared or a property name, rather than a reference to a global? */
export function isNameOnly(node: ts.Identifier): boolean {
  // Every identifier the check walks has a parent: the program parses with parent nodes set.
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return true;
  if (ts.isQualifiedName(parent) && parent.right === node) return true;
  if (
    (ts.isPropertyAssignment(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodSignature(parent) ||
      ts.isGetAccessorDeclaration(parent) ||
      ts.isSetAccessorDeclaration(parent) ||
      ts.isEnumMember(parent)) &&
    parent.name === node
  ) {
    return true;
  }
  if (ts.isBindingElement(parent) && parent.propertyName === node) return true;
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) return true;
  if (ts.isLabeledStatement(parent) || ts.isBreakOrContinueStatement(parent)) return true;
  return false;
}
