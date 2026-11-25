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

// A file depth folders below carnival/booths/<login>/ or carnival/attractions/<id>/ imports
// from the map's public parts, which are depth + 3 folders up, or from its own
// folder, never above it. The public parts are the theme, the square's shape
// and the diorama's drawing helpers: the registries and the rest of the map hold every other square, so a
// booth could reach them and change what they draw. A test beside it may also
// import vitest, but nothing else imports a test, so a test file can't carry
// code past the size budget.
function importRule(depth, test = false, up = 2) {
  const map = `(\\.\\./){${depth + up}}northpole/(theme|square|diorama)$`;
  const own = `(\\./${depth > 0 ? `|(\\.\\./){1,${depth}}` : ''})(?!.*\\.\\.)[\\w./-]+$`;
  return [
    'error',
    {
      patterns: [
        {
          regex: `^(?!${map}|${own}${test ? '|vitest$' : ''})`,
          message:
            'A square imports only northpole/theme, northpole/square, northpole/diorama and its own folder, so it adds no dependencies and reaches no other square.',
        },
        ...(test
          ? []
          : [
              {
                regex: '\\.test(\\.ts)?$',
                message: 'Only a test imports a test file, so its code stays out of the site.',
              },
            ]),
      ],
    },
  ];
}

// Helpers may sit in folders inside a booth, up to this deep. Deeper files keep
// the rule for depth 0, so they can import only from beside themselves.
const NESTED_DEPTH = 4;

// The folders whose squares draw on the map, one folder each, and how many
// folders up the map is from each square's own folder. A level's own squares
// live in carnival/levels/<login>/squares/<id>/.
const SQUARE_FOLDERS = ['carnival/booths', 'carnival/attractions', 'carnival/levels/*/squares'];
const UP = {
  'carnival/booths': 3,
  'carnival/attractions': 3,
  'carnival/levels/*/squares': 5,
};

// A level's level.ts is plain data the page reads, so it holds one object and
// nothing that runs: no calls, no functions, no getters, no references to
// anything, and its only import is the level's type.
const LEVEL_DATA = 'A level.ts is plain data: it holds only its NorthPoleLevel object, so';
const levelData = [
  ['CallExpression', 'no calls'],
  ['NewExpression', 'no new'],
  ['TaggedTemplateExpression', 'no tagged templates'],
  [':function', 'no functions'],
  [':matches(ClassDeclaration, ClassExpression)', 'no classes'],
  ['Property[kind!="init"]', 'no getters or setters'],
  ['Property[computed=true]', 'no computed keys'],
  ['Property[method=true]', 'no methods'],
  ['SpreadElement', 'no spreads'],
  ['MemberExpression', 'no reading properties of anything'],
  ['TemplateLiteral[expressions.length>0]', 'no templates with values in them'],
  ['ImportDeclaration[importKind!="type"]', 'only `import type`'],
  ['ImportExpression', 'no import()'],
  ['AwaitExpression', 'no await'],
  ['UpdateExpression, AssignmentExpression[left.type!="Identifier"]', 'no changing anything'],
  ['ExportNamedDeclaration', 'only its default export'],
  // What may be there at all, so nothing else runs when the page imports it:
  // `import type`, `const level = { ... }` and `export default level`, with
  // only objects, arrays and plain values inside.
  [
    'Program > :not(ImportDeclaration, VariableDeclaration, ExportDefaultDeclaration)',
    'only its import, its `const level` and `export default level`',
  ],
  ['VariableDeclaration[kind!="const"]', 'only `const`'],
  [
    'VariableDeclarator:matches([id.name!="level"], [init.type!="ObjectExpression"])',
    'only `const level = { ... }`',
  ],
  ['ExportDefaultDeclaration > :not(Identifier[name="level"])', 'only `export default level`'],
  [
    ':expression:not(ObjectExpression, ArrayExpression, Literal, TemplateLiteral, Identifier, UnaryExpression[operator="-"][argument.type="Literal"])',
    'only objects, arrays, strings, numbers and booleans',
  ],
  [
    ':matches(Property[value.type="Identifier"], ArrayExpression > Identifier.elements)',
    'no names of anything as values',
  ],
].map(([selector, what]) => ({ selector, message: `${LEVEL_DATA} ${what}.` }));

export default tseslint.config(
  {
    // Also skip what Tessl writes when you run tessl install: installed plugins
    // and each agent's copy of their skills. They aren't the carnival's code.
    ignores: [
      'dist',
      'coverage',
      'screenshots',
      'test-results',
      'playwright-report',
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
    // The house rules for every person's booth, carnival/booths/<login>/, and for
    // the North Pole's own attractions, carnival/attractions/<id>/.
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
          message: `${ESCAPE} import(): import from ../../../northpole/ or your own folder.`,
        },
        {
          selector:
            'CallExpression[callee.name=/^set(Timeout|Interval)$/][arguments.0.type=/^(Literal|TemplateLiteral|BinaryExpression)$/]',
          message: 'Pass setTimeout and setInterval a function, never a string.',
        },
      ],
    },
  },
  ...SQUARE_FOLDERS.flatMap((folder) => [
    {
      files: [`${folder}/*/**`],
      rules: { 'no-restricted-imports': importRule(0, false, UP[folder]) },
    },
    ...Array.from({ length: NESTED_DEPTH }, (_, index) => ({
      files: [`${folder}/*/${'*/'.repeat(index + 1)}*`],
      rules: { 'no-restricted-imports': importRule(index + 1, false, UP[folder]) },
    })),
    ...Array.from({ length: NESTED_DEPTH + 1 }, (_, depth) => ({
      files: [`${folder}/*/${'*/'.repeat(depth)}*.test.ts`],
      rules: { 'no-restricted-imports': importRule(depth, true, UP[folder]) },
    })),
  ]),
  {
    // A level's own folder: the house rules too, for anything beside its level.ts.
    files: ['carnival/levels/*/*'],
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-globals': ['error', ...squareGlobals],
      'no-restricted-properties': ['error', ...squareProperties],
    },
  },
  {
    // level.ts: plain data, importing only the level's type from the map.
    files: ['carnival/levels/*/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\.\\./\\.\\./\\.\\./northpole/level$)',
              message: 'A level.ts imports only the level types from ../../../northpole/level.',
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...levelData],
    },
  },
);
