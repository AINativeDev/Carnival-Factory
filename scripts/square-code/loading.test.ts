import { describe, expect, it } from 'vitest';
import { checkSquareCode } from '../square-code.ts';
import { rules } from './test-booth.ts';

describe('what a square runs when it loads', () => {
  it.each([
    ['an import', `import { theme } from '../../../src/northpole/theme';\nexport default theme;`],
    ['a variable', `export const x = 1;`],
    ['a function', `export function x() { return 1; }`],
    ['a class', `export class A { y = 1; }`],
    ['an interface', `export interface A { y: number }`],
    ['a type', `export type A = number;`],
    ['an enum', `export enum A { y }`],
    ['a default export', `export default 1;`],
    ['an export list', `const x = 1;\nexport { x };`],
  ])('lets %s through', (_, code) => {
    expect(rules(code)).toEqual([]);
  });

  it.each([
    ['a call', `console.log('hi');\nexport default 1;`],
    ['a loop', `for (;;) {}\nexport default 1;`],
    ['an if', `if (Math.random()) {}\nexport default 1;`],
    ['a block', `{ }\nexport default 1;`],
    ['a namespace', `namespace N { export const y = 1; }\nexport default 1;`],
  ])('stops %s at the top level', (_, code) => {
    expect(rules(code)).toContain('top-level');
  });

  it.each([
    ['an arrow function', `export const x = (() => 1)();`],
    ['a function expression', `export const x = (function () { return 1; })();`],
    ['twice-wrapped parentheses', `export const x = ((() => 1))();`],
    ['inside a function, too', `export function x() { return (() => 1)(); }`],
  ])('stops an immediately-invoked function: %s', (_, code) => {
    expect(rules(code)).toContain('top-level');
  });

  it('stops a static block', () => {
    expect(rules(`export class A { static { const y = 1; } }`)).toContain('top-level');
  });

  it('lets a test run its describe and it calls at the top level', () => {
    const test = `import { it } from 'vitest';\nit('works', () => {});`;
    const found = checkSquareCode('carnival/booths/elf/', [
      { path: 'carnival/booths/elf/booth.test.ts', text: test },
    ]);
    expect(found).toEqual([]);
  });
});

describe('checkSquareCode, on loading', () => {
  it('runs nothing when it loads, not even inside a declaration', () => {
    expect(rules(`export const x = (() => 1)();`)).toContain('top-level');
    expect(rules(`export const x = (function () { return 1; })();`)).toContain('top-level');
    expect(rules(`export class A { static { const y = 1; } }`)).toContain('top-level');
    expect(rules(`console.log('hi');\nexport default 1;`)).toContain('top-level');
    expect(rules(`for (;;) {}\nexport default 1;`)).toContain('top-level');
  });
});
