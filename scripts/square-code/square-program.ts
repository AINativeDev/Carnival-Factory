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

/** Each source file sits at `/<its path>`, so imports between them resolve as in the repository. */
export function squareProgram(sources: readonly SourceFile[]): ts.Program {
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
