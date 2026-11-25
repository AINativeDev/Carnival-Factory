import { describe, expect, it } from 'vitest';
import { rules } from './test-booth.ts';

describe('computed property access', () => {
  it.each([
    ['a joined string', `export const x = (o: Record<string, unknown>) => o['con' + 'structor'];`],
    ['a constant', `const k = 'a'; export const x = (o: Record<string, unknown>) => o[k];`],
    ['a parameter', `export const x = (o: Record<string, unknown>, k: string) => o[k];`],
    ['a symbol', `const s = Symbol('a'); export const x = (o: any) => o[s];`],
    ['anything', `export const x = (o: any, k: any) => o[k];`],
    ['an unknown', `export const x = (o: any, k: unknown) => o[k as never];`],
  ])('stops a key that is %s', (_, code) => {
    expect(rules(code)).toContain('computed-access');
  });

  it('lets numbers index arrays', () => {
    expect(rules(`const a = [1, 2]; export const x = (i: number) => a[i] + a[0];`)).toEqual([]);
    expect(rules(`enum E { a } const a = [1]; export const x = a[E.a];`)).toEqual([]);
  });
});

describe('the syntax a square may not use', () => {
  it.each([
    ['with', `export const x = (o: object) => { with (o) {} };`],
    ['debugger', `export const x = () => { debugger; };`],
    ['a tagged template', 'const t = (s: TemplateStringsArray) => s; export const x = t`a`;'],
  ])('stops %s', (_, code) => {
    expect(rules(code)).toContain('syntax');
  });

  it('lets a plain template through', () => {
    expect(rules('export const x = (n: number) => `n is ${n}`;')).toEqual([]);
  });

  it.each(['OffscreenCanvas', 'HTMLCanvas', 'MyCanvas'])(
    'stops a canvas of its own: %s',
    (name) => {
      const code = `class MyCanvas {}\nexport const x = () => new ${name}();`;
      expect(rules(code)).toContain('global');
    },
  );

  it('lets it make other things with new', () => {
    expect(rules(`class Flake {}\nexport const x = () => new Flake();`)).toEqual([]);
  });
});

describe('loading other code', () => {
  it('stops a dynamic import and import.meta', () => {
    expect(rules(`export const x = () => import('./other');`)).toContain('import');
    expect(rules(`export const x = import.meta.url;`)).toContain('import');
  });
});

describe('checkSquareCode, on computed access and syntax', () => {
  it('catches string-keyed computed access, however the key is built', () => {
    expect(
      rules(`export const x = (o: Record<string, unknown>) => o['con' + 'structor'];`),
    ).toContain('computed-access');
    expect(
      rules(`const k = 'a'; export const x = (o: Record<string, unknown>) => o[k];`),
    ).toContain('computed-access');
    expect(rules(`export const x = (o: Record<string, unknown>, k: string) => o[k];`)).toContain(
      'computed-access',
    );
  });

  it('lets numbers index arrays', () => {
    expect(rules(`const a = [1, 2]; export const x = (i: number) => a[i] + a[0];`)).toEqual([]);
  });

  it('catches with, debugger, tagged templates and its own canvases', () => {
    expect(rules(`export const x = () => { debugger; };`)).toContain('syntax');
    expect(rules('const t = (s: TemplateStringsArray) => s; export const x = t`a`;')).toContain(
      'syntax',
    );
    expect(rules(`export const x = () => new OffscreenCanvas(1, 1);`)).toContain('global');
  });
});
