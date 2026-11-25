/**
 * Where a square's code may come from: the map's theme, square shape and
 * diorama helpers, its own folder, and, for its tests, vitest. Anything else,
 * including import() and import.meta, would load code the check never saw.
 */
import ts from 'typescript';
import { isTest, type SquareFile } from './problems.ts';

/**
 * The only files outside its own folder a square may import: the map's theme,
 * square shape and diorama helpers, by the right number of `../` for where the importing file
 * sits: one per folder in the square's own path (three from `carnival/booths/<login>/`),
 * one more per nested folder.
 */
function isMapImport(folder: string, from: string, specifier: string): boolean {
  const up = folder.split('/').filter(Boolean).length;
  const depth = from.slice(folder.length).split('/').length - 1;
  return new RegExp(`^(\\.\\./){${depth + up}}src/northpole/(theme|square|diorama)$`).test(
    specifier,
  );
}

/** Resolves a relative import against the importing file, and says whether it stays in `folder`. */
function staysInside(folder: string, from: string, specifier: string): boolean {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return false;
  const parts = from.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  }
  return parts.join('/').startsWith(folder);
}

export function checkImports(node: ts.Node, { folder, path, report }: SquareFile): void {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    const specifier = node.moduleSpecifier;
    if (specifier && ts.isStringLiteral(specifier)) {
      const target = specifier.text;
      const ok =
        isMapImport(folder, path, target) ||
        (staysInside(folder, path, target) && (isTest(path) || !/\.test(\.ts)?$/.test(target))) ||
        (isTest(path) && target === 'vitest');
      if (!ok)
        report(
          node,
          'import',
          `Imports "${target}": only src/northpole/theme, src/northpole/square, src/northpole/diorama and its own folder.`,
        );
    }
  }
  if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    report(node, 'import', "Dynamic import() loads code a static check can't see.");
  }
  if (ts.isMetaProperty(node)) {
    report(node, 'import', 'import.meta reaches outside the square.');
  }
}
