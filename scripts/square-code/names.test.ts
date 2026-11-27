import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { isNameOnly } from './names.ts';

/** Whether each identifier written `top` in `code` is only a name, in the order they're written. */
function topsIn(code: string): boolean[] {
  const source = ts.createSourceFile('/booth.ts', code, ts.ScriptTarget.ES2022, true);
  const found: boolean[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && node.text === 'top') found.push(isNameOnly(node));
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('isNameOnly: a name, not a reference', () => {
  it.each([
    ['a property read', 'o.top;'],
    ['the right of a qualified type name', 'type T = N.top;'],
    ['an object key', '({ top: 1 });'],
    ['a method', '({ top() {} });'],
    ['a class field', 'class A { top = 1; }'],
    ['an interface member', 'interface A { top: number }'],
    ['an interface method', 'interface A { top(): void }'],
    ['a getter', '({ get top() { return 1; } });'],
    ['a setter', '({ set top(v: number) {} });'],
    ['an enum member', 'enum E { top }'],
    ['a destructured key', 'const { top: t } = o;'],
    ['an import', "import { top } from './parts';"],
    ['an export', 'export { top };'],
    ['a label', 'top: for (;;) {}'],
    ['a break', 'for (;;) { break top; }'],
    ['a continue', 'for (;;) { continue top; }'],
  ])('%s', (_, code) => {
    expect(topsIn(code)).toEqual([true]);
  });
});

describe('isNameOnly: a reference, which may be a global', () => {
  it.each([
    ['a plain reference', 'top;'],
    ['the object of a property read', 'top.close;'],
    ['the left of a qualified type name', 'type T = typeof top.x;'],
    ['an object value', '({ a: top });'],
    ['a class field value', 'class A { a = top; }'],
    ['an enum member value', 'enum E { a = top }'],
    ['a destructured default', 'const { a = top } = o;'],
    ['a destructured name', 'const { top } = o;'],
    ['a variable declared', 'const top = 1;'],
    ['a function declared', 'function top() {}'],
    ['a parameter', 'const f = (top: number) => 1;'],
  ])('%s', (_, code) => {
    expect(topsIn(code)).toEqual([false]);
  });
});
