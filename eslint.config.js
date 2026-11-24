import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ESCAPE = 'A booth only draws on its own square, so it may not use';

// What a booth may not reach for: the network, storage, other windows and the
// page's address. A booth draws with the canvas it is given and nothing else.
const squareGlobals = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'Worker',
  'SharedWorker',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'caches',
  'parent',
  'top',
  'opener',
  'open',
  'location',
  'eval',
  'Function',
  // The global object and the document lead to all of the above, as
  // window.fetch or const w = window; w.fetch, so a booth may not touch them.
  'window',
  'globalThis',
  'self',
  'frames',
  'document',
  // Node's ways to the file system and other modules. A booth never needs them
  // in the browser, and its tests run in Node before the preview is published.
  'process',
  'require',
  'module',
  'global',
  'Buffer',
].map((name) => ({ name, message: `${ESCAPE} ${name}.` }));

const squareProperties = [
  { object: 'navigator', property: 'sendBeacon', message: `${ESCAPE} navigator.sendBeacon.` },
  // The other ways back to the window: ctx.canvas.ownerDocument.defaultView,
  // and the Function constructor through any function's .constructor.
  ...['ownerDocument', 'defaultView', 'constructor'].map((property) => ({
    property,
    message: `${ESCAPE} .${property}.`,
  })),
];

// A file depth folders below booths/<login>/ or attractions/<id>/
// imports from the map, which is depth + 2 folders up, or from its own folder,
// never above it. A test beside it may import vitest too.
function importRule(depth, test = false) {
  const map = `(\\.\\./){${depth + 2}}northpole/[\\w-]+(\\.json)?$`;
  const own = `(\\./${depth > 0 ? `|(\\.\\./){1,${depth}}` : ''})(?!.*\\.\\.)[\\w./-]+$`;
  return [
    'error',
    {
      patterns: [
        {
          regex: `^(?!${map}|${own}${test ? '|vitest$' : ''})`,
          message:
            'A booth imports only from northpole/ and from its own folder, so it adds no dependencies.',
        },
      ],
    },
  ];
}

// Helpers may sit in folders inside a booth, up to this deep. Deeper files keep
// the rule for depth 0, so they can import only from beside themselves.
const NESTED_DEPTH = 4;

// The folders whose squares draw on the map, one folder each.
const SQUARE_FOLDERS = ['booths', 'attractions'];

export default tseslint.config(
  {
    // Also skip what Tessl writes when you run tessl install: installed plugins
    // and each agent's copy of their skills. They aren't the carnival's code.
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      '.tessl',
      '.agents',
      '.claude',
      '.codex',
      '.cursor',
      '.vscode',
      '.github/skills',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // The house rules for every person's booth, booths/<login>/, and for
    // the North Pole's own attractions, attractions/<id>/.
    files: SQUARE_FOLDERS.map((folder) => `${folder}/*/**`),
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-globals': ['error', ...squareGlobals],
      'no-restricted-properties': ['error', ...squareProperties],
      'no-restricted-imports': importRule(0),
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message: `${ESCAPE} import(): import from ../../northpole/ or your own folder.`,
        },
        {
          selector:
            'CallExpression[callee.name=/^set(Timeout|Interval)$/][arguments.0.type=/^(Literal|TemplateLiteral|BinaryExpression)$/]',
          message: 'Pass setTimeout and setInterval a function, never a string.',
        },
      ],
    },
  },
  ...Array.from({ length: NESTED_DEPTH }, (_, index) => ({
    files: SQUARE_FOLDERS.map((folder) => `${folder}/*/${'*/'.repeat(index + 1)}*`),
    rules: { 'no-restricted-imports': importRule(index + 1) },
  })),
  ...Array.from({ length: NESTED_DEPTH + 1 }, (_, depth) => ({
    files: SQUARE_FOLDERS.map((folder) => `${folder}/*/${'*/'.repeat(depth)}*.test.ts`),
    rules: { 'no-restricted-imports': importRule(depth, true) },
  })),
);
