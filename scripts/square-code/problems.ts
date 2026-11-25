/**
 * What the square code check reports, and what each of its rules is given
 * while it walks one file: the square's folder, the file, the type checker
 * and a way to report what it finds.
 */
import type ts from 'typescript';

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

/** One code file of a square, as each rule family sees it. */
export interface SquareFile {
  /** The square's folder, e.g. carnival/booths/elf/. */
  folder: string;
  /** The file's path inside the repository. */
  path: string;
  checker: ts.TypeChecker;
  report: (node: ts.Node, rule: string, message: string) => void;
  /** Whether a name is declared in the square's own code, shadowing any global of the same name. */
  declaredHere: (node: ts.Identifier) => boolean;
}

/** A square's tests may run code at the top level and import vitest and other tests. */
export const isTest = (path: string) => /\.test\.ts$/.test(path);
