import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ESCAPE = 'A plot only draws on its own square, so it may not use';

// What a plot may not reach for: the network, storage, other windows and the
// page's address. A plot draws with the canvas it is given and nothing else.
const plotGlobals = [
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
  // window.fetch or const w = window; w.fetch, so a plot may not touch them.
  'window',
  'globalThis',
  'self',
  'frames',
  'document',
].map((name) => ({ name, message: `${ESCAPE} ${name}.` }));

const plotProperties = [
  { object: 'navigator', property: 'sendBeacon', message: `${ESCAPE} navigator.sendBeacon.` },
  // The other ways back to the window: ctx.canvas.ownerDocument.defaultView,
  // and the Function constructor through any function's .constructor.
  ...['ownerDocument', 'defaultView', 'constructor'].map((property) => ({
    property,
    message: `${ESCAPE} .${property}.`,
  })),
];

// A file depth folders below src/plots/<login>/ or src/attractions/<id>/
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
            'A plot imports only from src/northpole/ and from its own folder, so it adds no dependencies.',
        },
      ],
    },
  ];
}

// Helpers may sit in folders inside a plot, up to this deep. Deeper files keep
// the rule for depth 0, so they can import only from beside themselves.
const NESTED_DEPTH = 4;

// The folders whose squares draw on the map, one folder each.
const PLOT_FOLDERS = ['src/plots', 'src/attractions'];

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
    // The house rules for every person's plot, src/plots/<login>/, and for
    // the North Pole's own attractions, src/attractions/<id>/.
    files: PLOT_FOLDERS.map((folder) => `${folder}/*/**`),
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-globals': ['error', ...plotGlobals],
      'no-restricted-properties': ['error', ...plotProperties],
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
    files: PLOT_FOLDERS.map((folder) => `${folder}/*/${'*/'.repeat(index + 1)}*`),
    rules: { 'no-restricted-imports': importRule(index + 1) },
  })),
  ...Array.from({ length: NESTED_DEPTH + 1 }, (_, depth) => ({
    files: PLOT_FOLDERS.map((folder) => `${folder}/*/${'*/'.repeat(depth)}*.test.ts`),
    rules: { 'no-restricted-imports': importRule(depth, true) },
  })),
);
