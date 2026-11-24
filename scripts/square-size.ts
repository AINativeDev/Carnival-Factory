/**
 * The size budget for a booth or an attraction, so no square can make the map
 * slow to load for everyone. Plain functions, so the budget can be tested on
 * made-up folders; `square-size.test.ts` runs it on every real one.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

/** Gzipped bytes of code a square may ship: its `.ts` files, without tests. */
export const CODE_BUDGET = 50 * 1024;
/** Bytes of everything else a square may ship, such as images. */
export const ASSET_BUDGET = 200 * 1024;

export interface SquareSize {
  /** Gzipped size of the square's code. */
  code: number;
  /** Raw size of its other files, not counting its README. */
  assets: number;
}

function filesIn(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

const isTest = (file: string) => /\.test\.ts$/.test(file);
const isCode = (file: string) => file.endsWith('.ts') && !isTest(file);
const isReadme = (file: string) => /(^|\/)README\.md$/.test(file);

export function measureSquare(folder: string): SquareSize {
  const files = filesIn(folder).map((file) => relative(folder, file));
  const code = files.filter(isCode).map((file) => readFileSync(join(folder, file)));
  const assets = files.filter((file) => !isCode(file) && !isTest(file) && !isReadme(file));
  return {
    code: code.length ? gzipSync(Buffer.concat(code)).length : 0,
    assets: assets.reduce((total, file) => total + statSync(join(folder, file)).size, 0),
  };
}

/** What's over budget, in words a participant can act on. Empty means it fits. */
export function overBudget(size: SquareSize): string[] {
  const kb = (bytes: number) => `${Math.ceil(bytes / 1024)} KB`;
  const problems: string[] = [];
  if (size.code > CODE_BUDGET) {
    problems.push(`its code is ${kb(size.code)} gzipped, over the ${kb(CODE_BUDGET)} budget`);
  }
  if (size.assets > ASSET_BUDGET) {
    problems.push(`its other files are ${kb(size.assets)}, over the ${kb(ASSET_BUDGET)} budget`);
  }
  return problems;
}
