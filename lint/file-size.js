/**
 * Code files stay under 200 lines, so an agent can read one whole and a diff
 * touches one concern (docs/adr/0019-small-files.md). There are no exceptions:
 * the baseline that held older files at their length is gone, now that every
 * one of them is split (docs/adr/0036-no-oversize-files.md).
 */
export const MAX_LINES = 200;

/** Lines as ESLint's max-lines counts them: a final newline adds none. */
export function countLines(text) {
  const lines = text.split(/\r\n|\r|\n/);
  return lines.at(-1) === '' ? lines.length - 1 : lines.length;
}

/** The ESLint config block: the one limit for every code file, squares included. */
export function sizeLimits() {
  return [
    {
      files: ['**/*.{ts,js,mjs,cjs}'],
      rules: {
        'max-lines': ['error', { max: MAX_LINES, skipBlankLines: false, skipComments: false }],
      },
    },
  ];
}
