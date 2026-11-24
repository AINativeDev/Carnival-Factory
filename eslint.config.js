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
].map((name) => ({ name, message: `${ESCAPE} ${name}.` }));

const plotProperties = [
  ...['window', 'globalThis', 'self', 'document'].flatMap((object) =>
    [
      'fetch',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'parent',
      'top',
      'opener',
      'open',
      'location',
      'eval',
      'cookie',
    ].map((property) => ({ object, property, message: `${ESCAPE} ${object}.${property}.` })),
  ),
  { object: 'navigator', property: 'sendBeacon', message: `${ESCAPE} navigator.sendBeacon.` },
];

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
    // The house rules for every person's plot, src/plots/<login>/.
    files: ['src/plots/*/**'],
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-globals': ['error', ...plotGlobals],
      'no-restricted-properties': ['error', ...plotProperties],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\.\\./\\.\\./northpole/[\\w-]+(\\.json)?$|\\./(?!.*\\.\\.)[\\w./-]+$)',
              message:
                'A plot imports only from ../../northpole/ and from its own folder, so it adds no dependencies.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message: `${ESCAPE} import(): import from ../../northpole/ or your own folder.`,
        },
        {
          selector:
            "CallExpression[callee.name=/^set(Timeout|Interval)$/][arguments.0.type!='ArrowFunctionExpression'][arguments.0.type!='FunctionExpression'][arguments.0.type!='Identifier']",
          message: 'Pass setTimeout and setInterval a function, never a string.',
        },
      ],
    },
  },
);
