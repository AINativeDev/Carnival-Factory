/**
 * The names a square may not reach for: the globals that lead to the page,
 * the worker, the network or Node, and the properties that lead back to them.
 * The code check (scripts/square-code.ts) stops each one used as code and
 * each one written as a string, which could be used as a key to reach it.
 */
/** Globals a square has no business with: the page, the worker, timers, the network, Node. */
export const BANNED_GLOBALS = new Set([
  // The page and other windows.
  'window',
  'document',
  'globalThis',
  'self',
  'frames',
  'parent',
  'top',
  'opener',
  'location',
  'navigator',
  'history',
  'screen',
  // The worker a square runs in, and its messages.
  'postMessage',
  'importScripts',
  'onmessage',
  'onerror',
  'addEventListener',
  'removeEventListener',
  'dispatchEvent',
  'close',
  // The network, storage and other threads.
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'Worker',
  'SharedWorker',
  'BroadcastChannel',
  'MessageChannel',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'caches',
  'cookieStore',
  // Running code from text, or reaching the language's internals.
  'eval',
  'Function',
  'Reflect',
  'Proxy',
  'WebAssembly',
  'Atomics',
  'SharedArrayBuffer',
  // Timers: a square draws when asked, and keeps no loop of its own.
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'requestIdleCallback',
  'queueMicrotask',
  // Timing and other ways to learn about the visitor.
  'performance',
  // Node.
  'process',
  'require',
  'module',
  'exports',
  'global',
  'Buffer',
  '__dirname',
  '__filename',
]);

/** Properties that lead back to the page, the worker or the language's internals. */
export const BANNED_PROPERTIES = new Set([
  'constructor',
  'prototype',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'ownerDocument',
  'defaultView',
  'getRootNode',
  'parentElement',
  'getPrototypeOf',
  'setPrototypeOf',
  'defineProperty',
  'defineProperties',
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'transferToImageBitmap',
  'convertToBlob',
  'getImageData',
  'toDataURL',
  'toBlob',
]);

/** Every banned name, which a square may not write as a string either. */
export const NOT_A_GLOBAL = new Set([...BANNED_GLOBALS, ...BANNED_PROPERTIES]);
