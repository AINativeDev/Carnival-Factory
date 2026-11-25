import { describe, expect, it } from 'vitest';
import {
  LEVEL_DATA,
  NESTED_DEPTH,
  SQUARE_FOLDERS,
  UP,
  importRule,
  levelData,
} from '../lint/house-rules.js';

/**
 * The house rules as eslint.config.js reads them. scripts/square-lint.test.ts
 * tries them on real snippets through ESLint; these try their parts directly,
 * which ESLint loads outside the test's own module graph.
 */

/** Whether a square at `depth` below its folder may import `path`, by the rule's patterns. */
function allowed(path: string, depth: number, test = false, up = 3) {
  const [, { patterns }] = importRule(depth, test, up);
  return patterns.every((pattern) => !new RegExp(pattern.regex).test(path));
}

describe('what a square may import', () => {
  it("allows the map's public parts and its own folder, and nothing else", () => {
    expect(allowed('../../../src/northpole/theme', 0)).toBe(true);
    expect(allowed('../../../src/northpole/diorama', 0)).toBe(true);
    expect(allowed('./wobble', 0)).toBe(true);
    expect(allowed('../../../src/northpole/booths', 0)).toBe(false);
    expect(allowed('../ana/booth', 0)).toBe(false);
    expect(allowed('lodash', 0)).toBe(false);
  });

  it('lets a nested helper reach back up to its square, but never above it', () => {
    expect(allowed('../../../../../src/northpole/theme', 2)).toBe(true);
    expect(allowed('../../shapes', 2)).toBe(true);
    expect(allowed('../../../shapes', 2)).toBe(false);
  });

  it('lets only a test import vitest or another test', () => {
    expect(allowed('vitest', 0)).toBe(false);
    expect(allowed('vitest', 0, true)).toBe(true);
    expect(allowed('./booth.test', 0)).toBe(false);
    expect(allowed('./booth.test', 0, true)).toBe(true);
  });

  it("knows how far up the map is from each kind of square's folder", () => {
    expect(SQUARE_FOLDERS.map((folder) => UP[folder])).toEqual([3, 3, 5]);
    expect(NESTED_DEPTH).toBe(4);
  });
});

describe("a level's plain-data rules", () => {
  it('gives every restricted syntax a selector and a message that says why', () => {
    expect(levelData.length).toBeGreaterThan(10);
    for (const rule of levelData) {
      expect(rule.selector).not.toBe('');
      expect(rule.message.startsWith(`${LEVEL_DATA} `)).toBe(true);
      expect(rule.message.endsWith('.')).toBe(true);
    }
  });

  it('forbids calls and functions in so many words', () => {
    expect(levelData).toContainEqual({
      selector: 'CallExpression',
      message: `${LEVEL_DATA} no calls.`,
    });
    expect(levelData).toContainEqual({
      selector: ':function',
      message: `${LEVEL_DATA} no functions.`,
    });
  });
});
