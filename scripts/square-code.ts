/**
 * The deterministic code check for a booth: reads its source with the
 * TypeScript compiler (parsing and type checking only, never running it) and
 * reports anything that could reach outside the booth's own square. It's
 * stricter than the ESLint house rules, because it decides whether a booth may
 * merge without a person looking, so when in doubt it says no.
 *
 * Plain functions, so they can be tested on made-up booths; the auto-merge
 * gate runs them on a pull request's files, fetched as text.
 */
import ts from 'typescript';
import { readPlotFile } from '../northpole/plots.ts';
import { hiddenCharacters, injectionMarkers } from './injection-scan.ts';

/** Globals a square has no business with: the page, the worker, timers, the network, Node. */
export const BANNED_GLOBALS = new Set([
  // The page and other windows.
  'window',
  'document',
  'globalThis',
  'self',
  'frames',
  'parent',
  'top',
  'opener',
  'location',
  'navigator',
  'history',
  'screen',
  // The worker a square runs in, and its messages.
  'postMessage',
  'importScripts',
  'onmessage',
  'onerror',
  'addEventListener',
  'removeEventListener',
  'dispatchEvent',
  'close',
  // The network, storage and other threads.
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'Worker',
  'SharedWorker',
  'BroadcastChannel',
  'MessageChannel',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'caches',
  'cookieStore',
  // Running code from text, or reaching the language's internals.
  'eval',
  'Function',
  'Reflect',
  'Proxy',
  'WebAssembly',
  'Atomics',
  'SharedArrayBuffer',
  // Timers: a square draws when asked, and keeps no loop of its own.
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'requestIdleCallback',
  'queueMicrotask',
  // Timing and other ways to learn about the visitor.
  'performance',
  // Node.
  'process',
  'require',
  'module',
  'exports',
  'global',
  'Buffer',
  '__dirname',
  '__filename',
]);

/** Properties that lead back to the page, the worker or the language's internals. */
export const BANNED_PROPERTIES = new Set([
  'constructor',
  'prototype',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'ownerDocument',
  'defaultView',
  'getRootNode',
  'parentElement',
  'getPrototypeOf',
  'setPrototypeOf',
  'defineProperty',
  'defineProperties',
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'transferToImageBitmap',
  'convertToBlob',
  'getImageData',
  'toDataURL',
  'toBlob',
]);

/**
 * The only files outside its own folder a square may import: the map's theme,
 * square shape and diorama helpers, by the right number of `../` for where the importing file
 * sits: one per folder in the square's own path (three from `carnival/booths/<login>/`),
 * one more per nested folder.
 */
function isMapImport(folder: string, from: string, specifier: string): boolean {
  const up = folder.split('/').filter(Boolean).length;
  const depth = from.slice(folder.length).split('/').length - 1;
  return new RegExp(`^(\\.\\./){${depth + up}}northpole/(theme|square|diorama)$`).test(specifier);
}
const NOT_A_GLOBAL = new Set([...BANNED_GLOBALS, ...BANNED_PROPERTIES]);

export interface CodeProblem {
  file: string;
  line: number;
  rule: string;
  message: string;
}

export interface SourceFile {
  /** The path inside the repository, e.g. carnival/booths/elf/booth.ts. */
  path: string;
  text: string;
}

const isTest = (path: string) => /\.test\.ts$/.test(path);

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

/** Is this identifier a name being declared or a property name, rather than a reference to a global? */
function isNameOnly(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return false;
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

/** Whether a booth's plot.json is small, and holds only a plot number and maybe an issue number. */
export function isPlotFile(text: string): boolean {
  if (text.length > 64) return false;
  try {
    const value = JSON.parse(text) as unknown;
    const plot = readPlotFile(value);
    return !!plot && Object.keys(value as object).length === Object.keys(plot).length;
  } catch {
    return false;
  }
}

/**
 * Whether a pull request adds, changes or removes a booth's plot.json when the
 * booth isn't new. Only a new booth's first pull request, the one that adds
 * its booth.ts, writes the plot its construction site held; after that the
 * file never changes, so a booth never moves. `files` is the pull request's
 * changed files, with GitHub's status for each.
 */
export function plotFileProblems(
  folder: string,
  files: readonly { filename: string; status: string; previous_filename?: string }[],
): CodeProblem[] {
  const plot = `${folder}plot.json`;
  const touched = files.some((file) => file.filename === plot || file.previous_filename === plot);
  const isNew = files.some(
    (file) => file.filename === `${folder}booth.ts` && file.status === 'added',
  );
  if (!touched || isNew) return [];
  return [
    {
      file: plot,
      line: 0,
      rule: 'plot-file',
      message:
        "Only a new booth's first pull request writes plot.json: changing it needs a person.",
    },
  ];
}

/**
 * Checks every source file of one square (a booth's folder, given as
 * `folder`, e.g. `carnival/booths/elf/`). Returns every problem found; empty means the
 * code keeps to its square as far as a static check can tell.
 */
export function checkSquareCode(folder: string, files: readonly SourceFile[]): CodeProblem[] {
  const problems: CodeProblem[] = [];
  const sources = files.filter((file) => file.path.endsWith('.ts'));

  // Text checks on every file, code or not: hidden characters and injection markers.
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

  // The only other file a booth's code check lets through: its own plot.json,
  // a single plot number and maybe its request's issue number, and nothing else.
  for (const file of files) {
    if (!file.path.endsWith('.json')) continue;
    if (file.path !== `${folder}plot.json`) {
      problems.push({
        file: file.path,
        line: 0,
        rule: 'files',
        message: 'The only JSON file a booth has is its own plot.json.',
      });
    } else if (!isPlotFile(file.text)) {
      problems.push({
        file: file.path,
        line: 0,
        rule: 'plot-file',
        message: 'plot.json holds only { "plot": <number> }, and maybe "issue": <number>.',
      });
    }
  }

  // Type information, for computed property access.
  const host = ts.createCompilerHost({}, true);
  const byName = new Map(sources.map((file) => [`/${file.path}`, file.text]));
  const libHost: ts.CompilerHost = {
    ...host,
    fileExists: (name) => byName.has(name) || host.fileExists(name),
    readFile: (name) => byName.get(name) ?? host.readFile(name),
    getSourceFile: (name, languageVersion) => {
      const text = byName.get(name);
      return text !== undefined
        ? ts.createSourceFile(name, text, languageVersion, true)
        : host.getSourceFile(name, languageVersion);
    },
    getCurrentDirectory: () => '/',
  };
  const program = ts.createProgram({
    rootNames: [...byName.keys()],
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      noEmit: true,
      lib: ['lib.es2022.d.ts'],
      types: [],
      allowImportingTsExtensions: true,
    },
    host: libHost,
  });
  const checker = program.getTypeChecker();

  for (const file of sources) {
    const source = program.getSourceFile(`/${file.path}`);
    if (!source) continue;
    const report = (node: ts.Node, rule: string, message: string) => {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      problems.push({ file: file.path, line: line + 1, rule, message });
    };

    // Only declarations at the top level: loading a square must do nothing but define it.
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
        (isTest(file.path) && ts.isExpressionStatement(statement));
      if (!allowed) {
        report(
          statement,
          'top-level',
          'Only declarations at the top level: loading a square should only define it.',
        );
      }
    }

    /** Is this name declared in the square's own code, shadowing any global of the same name? */
    const ownFiles = new Set(sources.map((f) => `/${f.path}`));
    const declaredHere = (node: ts.Identifier) => {
      const symbol = checker.getSymbolAtLocation(node);
      return (
        !!symbol?.declarations?.length &&
        symbol.declarations.every((d) => ownFiles.has(d.getSourceFile().fileName))
      );
    };

    const visit = (node: ts.Node) => {
      // Code run while the square loads, hidden inside a declaration: an
      // immediately-invoked function, or a class's static block.
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        let callee: ts.Expression | undefined = node.expression;
        while (callee && ts.isParenthesizedExpression(callee)) callee = callee.expression;
        if (callee && (ts.isFunctionExpression(callee) || ts.isArrowFunction(callee))) {
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
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (specifier && ts.isStringLiteral(specifier)) {
          const target = specifier.text;
          const ok =
            isMapImport(folder, file.path, target) ||
            (staysInside(folder, file.path, target) &&
              (isTest(file.path) || !/\.test(\.ts)?$/.test(target))) ||
            (isTest(file.path) && target === 'vitest');
          if (!ok)
            report(
              node,
              'import',
              `Imports "${target}": only northpole/theme, northpole/square, northpole/diorama and its own folder.`,
            );
        }
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        report(node, 'import', "Dynamic import() loads code a static check can't see.");
      }
      if (ts.isMetaProperty(node)) {
        report(node, 'import', 'import.meta reaches outside the square.');
      }
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
        (ts.isPropertyAssignment(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === '__proto__')
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
        const index = node.argumentExpression;
        const type = checker.getTypeAtLocation(index);
        const numeric = (type.flags & ts.TypeFlags.NumberLike) !== 0;
        if (!numeric) {
          report(
            node,
            'computed-access',
            'Computed property access must use a number index: a string key can reach anything.',
          );
        }
      }
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
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return problems;
}
