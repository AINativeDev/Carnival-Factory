/**
 * The craft of a square: whether its code follows the conventions the map's own
 * code does (docs/adr/0029-booth-craft.md). Each convention met earns a badge
 * shown on the square's panel; each one missed comes with what to do about it,
 * which the factory and the agent hooks hand straight to whoever is building it.
 * Lint is checked separately, by ESLint itself.
 */
import ts from 'typescript';

/** A square's files by their path inside its folder, as text. */
export type SquareFiles = Record<string, string>;

type Badge = 'small-files' | 'tested' | 'documented' | 'clear-names';

export interface Craft {
  badges: Badge[];
  problems: string[];
}

const MAX_LINES = 200;
const MIN_README_WORDS = 15;

/** Names that say how a thing is stored, not what it is in the scene. */
const GENERIC_NAMES = new Set(
  'data temp tmp foo bar baz obj stuff thing things misc helper helpers util utils manager'.split(
    ' ',
  ),
);

const isCode = (path: string) => /\.(ts|js)$/.test(path);
const isTest = (path: string) => /\.test\.ts$/.test(path);
/** Lines of text; a final newline ends the last line rather than starting another. */
const lineCount = (text: string) => text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
const parse = (path: string, text: string) =>
  ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);

function sizeProblems(files: SquareFiles): string[] {
  return Object.entries(files)
    .filter(([path, text]) => isCode(path) && lineCount(text) > MAX_LINES)
    .map(
      ([path, text]) =>
        `${path} is ${lineCount(text)} lines; split it so each file has ${MAX_LINES} or fewer.`,
    );
}

function testProblems(files: SquareFiles): string[] {
  const tests = Object.entries(files).filter(([path]) => isTest(path));
  if (tests.length === 0)
    return ['No test: add a .test.ts that checks what the square does, written first.'];
  return tests
    .filter(([, text]) => !/from '\.\/(?!.*\.test)/.test(text))
    .map(
      ([path]) => `${path} tests nothing of the square: import its code and check what it does.`,
    );
}

/** Whether a statement has a doc comment (one that opens with two asterisks) before it. */
const hasDoc = (node: ts.Node, text: string) =>
  ts
    .getLeadingCommentRanges(text, node.getFullStart())
    ?.some((range) => text.startsWith('/**', range.pos)) ?? false;

/** Whether a statement is marked `export`. */
const isExported = (node: ts.HasModifiers) =>
  ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;

/** The names a statement exports, if it exports any. */
function exportedNames(statement: ts.Statement): string[] {
  if (ts.isVariableStatement(statement) && isExported(statement))
    return statement.declarationList.declarations.map((d) => d.name.getText());
  if (
    (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
    isExported(statement)
  )
    return [statement.name?.getText() ?? 'default'];
  return [];
}

/** The words in a text: what stands between spaces with a letter or a digit in it. */
const wordCount = (text: string) => text.split(/\s/).filter((word) => /\w/.test(word)).length;

function docProblems(files: SquareFiles): string[] {
  const problems: string[] = [];
  if (!('README.md' in files) || wordCount(files['README.md']) < MIN_README_WORDS)
    problems.push(
      'README.md says too little: describe what the square shows and does, in a few sentences.',
    );
  for (const [path, text] of Object.entries(files)) {
    if (!isCode(path) || isTest(path)) continue;
    for (const statement of parse(path, text).statements) {
      if (hasDoc(statement, text)) continue;
      for (const name of exportedNames(statement))
        problems.push(`${path}: export ${name} has no doc comment saying what it is for.`);
    }
  }
  return problems;
}

/** The generic names the code declares, as variables, functions, classes or parameters. */
function genericNames(source: ts.SourceFile): string[] {
  const names: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isVariableDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isParameter(node)) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      GENERIC_NAMES.has(node.name.text.toLowerCase())
    )
      names.push(node.name.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

function nameProblems(files: SquareFiles): string[] {
  const problems: string[] = [];
  for (const [path, text] of Object.entries(files)) {
    const fileName = path.slice(path.lastIndexOf('/') + 1);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z]+)+$/.test(fileName) && fileName !== 'README.md')
      problems.push(`${path}: name files in kebab-case, such as penguin-pond.ts.`);
    if (!isCode(path)) continue;
    for (const name of new Set(genericNames(parse(path, text))))
      problems.push(
        `${path}: ${name} says nothing about what it holds; name it for what it is in the scene.`,
      );
  }
  return problems;
}

/** The badges a square earns from its files, and what stands between it and the rest. */
export function craftOf(files: SquareFiles): Craft {
  const checks: [Badge, string[]][] = [
    ['small-files', sizeProblems(files)],
    ['tested', testProblems(files)],
    ['documented', docProblems(files)],
    ['clear-names', nameProblems(files)],
  ];
  return {
    badges: checks.filter(([, problems]) => problems.length === 0).map(([badge]) => badge),
    problems: checks.flatMap(([, problems]) => problems),
  };
}
