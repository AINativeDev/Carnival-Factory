import { describe, expect, it, vi } from 'vitest';

/**
 * isTest, loaded afresh inside each test, so mutation testing sees the test use
 * the function the module defines as it loads (docs/adr/0061-mutation-testing.md).
 */
async function isTest(path: string) {
  vi.resetModules();
  return (await import('./problems.ts')).isTest(path);
}

describe('isTest: the test files of a square', () => {
  it.each([
    ['booth.test.ts', true],
    ['parts/sky.test.ts', true],
    ['booth.ts', false],
    ['booth.test.tsx', false],
    ['booth.test.ts.bak', false],
    ['booth.test.js', false],
    ['booth-test.ts', false],
    ['test.ts', false],
  ])('%s is a test: %s', async (path, expected) => {
    expect(await isTest(path)).toBe(expected);
  });
});
