/**
 * The square's code as a TypeScript program, parsed and bound but never run,
 * so the rules can ask what type a computed key has and where a name is
 * declared. Its compiler errors are never read, so code that fails to type
 * check is not rejected for that. Its default library is the language's own,
 * with no DOM or Node types, but other files are read from the disk, so a
 * `/// <reference lib="dom" />` still brings the DOM's in: the banned names
 * are caught by name, whatever declares them.
 */
import ts from 'typescript';
import type { SourceFile } from './problems.ts';

/** Each source file sits at `/<its path>`, in folders TypeScript can see, so imports between them resolve as in the repository. */
export function squareProgram(sources: readonly SourceFile[]): ts.Program {
  // Stryker disable next-line BooleanLiteral: the type checker binds every file before a rule walks it, and binding sets each node's parent anyway
  const host = ts.createCompilerHost({}, true);
  const byName = new Map(sources.map((file) => [`/${file.path}`, file.text]));
  // Every folder the square's files sit in: TypeScript looks a folder up before
  // it looks for a file in it, so without these an import between the square's
  // own files resolves to nothing, and what it imports is typed `any`. Its own
  // library it finds by itself, and it reads the square's files through
  // getSourceFile, so neither needs the disk's folders or readFile.
  const folders = new Set(
    [...byName.keys()].flatMap((name) =>
      name
        .split('/')
        .slice(1, -1)
        .map((_, n, parts) => `/${parts.slice(0, n + 1).join('/')}`),
    ),
  );
  const libHost: ts.CompilerHost = {
    ...host,
    // Stryker disable next-line ConditionalExpression: a folder that "exists" with no file in it holds nothing to import
    directoryExists: (name) => folders.has(name),
    // Stryker disable next-line ConditionalExpression: a file that "exists" but isn't the square's has no source, so it stays unresolved
    fileExists: (name) => byName.has(name) || host.fileExists(name),
    getSourceFile: (name, languageVersion) => {
      const text = byName.get(name);
      return text !== undefined
        ? // Stryker disable next-line BooleanLiteral: the type checker binds every file before a rule walks it, and binding sets each node's parent anyway
          ts.createSourceFile(name, text, languageVersion, true)
        : host.getSourceFile(name, languageVersion);
    },
    getCurrentDirectory: () => '/',
  };
  return ts.createProgram({
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
}
