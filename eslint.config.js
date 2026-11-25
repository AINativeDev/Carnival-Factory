import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import {
  NESTED_DEPTH,
  SQUARE_FOLDERS,
  UP,
  ESCAPE,
  importRule,
  levelData,
  squareGlobals,
  squareProperties,
} from './lint/house-rules.js';
import { sizeLimits } from './lint/file-size.js';

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
  // Strict, type-aware rules for TypeScript (docs/adr/0027-strict-typescript.md).
  // What the code already broke when they came in is frozen in
  // eslint-suppressions.json: those counts can't grow, and new code is held to all of it.
  ...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: ['**/*.ts'] })),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
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
          message: `${ESCAPE} import(): import from ../../../src/northpole/ or your own folder.`,
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
              regex: '^(?!\\.\\./\\.\\./\\.\\./src/northpole/level$)',
              message: 'A level.ts imports only the level types from ../../../src/northpole/level.',
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...levelData],
    },
  },
  ...sizeLimits(),
);
