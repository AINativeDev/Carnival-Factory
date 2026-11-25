/**
 * The house rules for squares: what a booth, an attraction or a level's square
 * may reach for and import, and what a level's plain-data level.ts may hold.
 * They are the lint half of what keeps unattended merges safe (docs/adr/0004,
 * 0008, 0011); eslint.config.js applies them to the carnival's folders, and
 * scripts/square-lint.test.ts proves they still reach every real square.
 */
export const ESCAPE = 'A booth only draws on its own square, so it may not use';

// What a booth may not reach for: the network, storage, other windows and the
// page's address. A booth draws with the canvas it is given and nothing else.
export const squareGlobals = [
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

export const squareProperties = [
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
export function importRule(depth, test = false, up = 2) {
  const map = `(\\.\\./){${depth + up}}src/northpole/(theme|square|diorama)$`;
  const own = `(\\./${depth > 0 ? `|(\\.\\./){1,${depth}}` : ''})(?!.*\\.\\.)[\\w./-]+$`;
  return [
    'error',
    {
      patterns: [
        {
          regex: `^(?!${map}|${own}${test ? '|vitest$' : ''})`,
          message:
            'A square imports only src/northpole/theme, src/northpole/square, src/northpole/diorama and its own folder, so it adds no dependencies and reaches no other square.',
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
export const NESTED_DEPTH = 4;

// The folders whose squares draw on the map, one folder each, and how many
// folders up the map is from each square's own folder. A level's own squares
// live in carnival/levels/<login>/squares/<id>/.
export const SQUARE_FOLDERS = [
  'carnival/booths',
  'carnival/attractions',
  'carnival/levels/*/squares',
];
export const UP = {
  'carnival/booths': 3,
  'carnival/attractions': 3,
  'carnival/levels/*/squares': 5,
};

// A level's level.ts is plain data the page reads, so it holds one object and
// nothing that runs: no calls, no functions, no getters, no references to
// anything, and its only import is the level's type.
export const LEVEL_DATA = 'A level.ts is plain data: it holds only its NorthPoleLevel object, so';
export const levelData = [
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
