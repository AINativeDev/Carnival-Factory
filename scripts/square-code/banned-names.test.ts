import { describe, expect, it } from 'vitest';
import { BANNED_GLOBALS, BANNED_PROPERTIES } from '../square-code.ts';
import { rules } from './test-booth.ts';

// Written out by hand, not read from the sets, so dropping a name from the
// check fails here: every one is a way out of the square.
const GLOBALS = [
  ...['window', 'document', 'globalThis', 'self', 'frames', 'parent', 'top', 'opener'],
  ...['location', 'navigator', 'history', 'screen'],
  ...['postMessage', 'importScripts', 'onmessage', 'onerror', 'addEventListener'],
  ...['removeEventListener', 'dispatchEvent', 'close'],
  ...['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker'],
  ...['BroadcastChannel', 'MessageChannel', 'localStorage', 'sessionStorage', 'indexedDB'],
  ...['caches', 'cookieStore'],
  ...['eval', 'Function', 'Reflect', 'Proxy', 'WebAssembly', 'Atomics', 'SharedArrayBuffer'],
  ...['setTimeout', 'setInterval', 'requestAnimationFrame', 'requestIdleCallback'],
  ...['queueMicrotask', 'performance'],
  ...['process', 'require', 'module', 'exports', 'global', 'Buffer', '__dirname', '__filename'],
];
const PROPERTIES = [
  ...['constructor', 'prototype', '__proto__', '__defineGetter__', '__defineSetter__'],
  ...['__lookupGetter__', '__lookupSetter__', 'ownerDocument', 'defaultView', 'getRootNode'],
  ...['parentElement', 'getPrototypeOf', 'setPrototypeOf', 'defineProperty'],
  ...['defineProperties', 'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors'],
  ...['transferToImageBitmap', 'convertToBlob', 'getImageData', 'toDataURL', 'toBlob'],
];

describe('the banned names', () => {
  it('are exactly the ones written out here', () => {
    expect([...BANNED_GLOBALS].sort()).toEqual([...GLOBALS].sort());
    expect([...BANNED_PROPERTIES].sort()).toEqual([...PROPERTIES].sort());
  });

  it.each(GLOBALS)('catches the global %s', (name) => {
    expect(rules(`export const x = () => ${name};`)).toContain('global');
  });

  it.each(PROPERTIES)('catches the property .%s', (name) => {
    expect(rules(`export const x = (o: any) => o.${name};`)).toContain('property');
    expect(rules(`export const x = (o: any) => o?.${name};`)).toContain('property');
  });

  it.each([...GLOBALS, ...PROPERTIES])('catches the string "%s"', (name) => {
    expect(rules(`export const key = '${name}';`)).toContain('string');
    expect(rules(`export const key = \`${name}\`;`)).toContain('string');
  });

  it('lets other strings, and the same name in a longer string, through', () => {
    expect(rules(`export const key = 'snow';`)).toEqual([]);
    expect(rules(`export const key = 'the window';`)).toEqual([]);
  });

  it('catches __proto__ set in an object literal', () => {
    expect(rules(`export const x = { __proto__: null };`)).toContain('property');
    expect(rules(`export const x = { '__proto__': null };`)).toContain('string');
  });
});

describe('a banned name that is only a name', () => {
  it.each([
    ['a property read', `export const x = (o: { close(): void }) => o.close();`],
    ['an object key', `export const x = { fetch: 1, top: 2 };`],
    ['a method', `export const x = { close() { return 1; } };`],
    ['a getter and setter', `export const x = { get top() { return 1; }, set top(v: number) {} };`],
    ['a class member', `export class A { top = 1; close() { return this.top; } }`],
    ['an interface member', `export interface A { top: number; close(): void }`],
    ['an enum member', `export enum Side { top, parent }`],
    [
      'a destructured key',
      `export const x = (o: { top: number }) => { const { top: t } = o; return t; };`,
    ],
    [
      'a qualified type name',
      `namespace N { export type self = number; }\nexport type T = N.self;`,
    ],
    ['a label', `export const x = () => { top: for (;;) { break top; } };`],
  ])('lets %s through', (_, code) => {
    expect(rules(code)).not.toContain('global');
  });

  it('lets an import or export specifier through, and the code that declares it', () => {
    const extra = { 'parts.ts': 'export const close = 1;' };
    expect(rules(`import { close } from './parts';\nexport { close };`, extra)).toEqual([]);
  });

  it("lets the square's own names shadow a global", () => {
    expect(rules(`const close = () => 1;\nexport const x = () => close();`)).toEqual([]);
    expect(rules(`export const x = (self: number) => self + 1;`)).toEqual([]);
  });
});

describe('checkSquareCode, on the banned names', () => {
  it.each([
    ['fetch', `export const x = () => fetch('https://example.com');`],
    ['postMessage to the frame', `export const x = () => postMessage({ type: 'frame' });`],
    ['the worker itself', `export const x = () => self;`],
    ['a timer', `export const x = () => setTimeout(() => {}, 10);`],
    ['eval', `export const x = () => eval('1');`],
    ['Reflect', `export const x = (o: object) => Reflect.ownKeys(o);`],
    ['Proxy', `export const x = new Proxy({}, {});`],
    ['performance', `export const x = () => performance.now();`],
    ['Node', `export const x = () => process.env;`],
  ])('catches %s', (_, code) => {
    expect(rules(code)).toContain('global');
  });

  it.each([
    ['.constructor', `export const x = (f: () => void) => f.constructor;`],
    ['.__proto__', `export const x = (o: object) => (o as { __proto__: unknown }).__proto__;`],
    ['getImageData', `export const x = (c: { getImageData(): void }) => c.getImageData();`],
  ])('catches %s', (_, code) => {
    expect(rules(code)).toContain('property');
  });

  it('catches a string that names a way out', () => {
    expect(rules(`export const key = 'constructor';`)).toContain('string');
  });
});
