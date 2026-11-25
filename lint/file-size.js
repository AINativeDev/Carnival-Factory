import { readFileSync } from 'node:fs';

/**
 * Code files stay under 200 lines, so an agent can read one whole and a diff
 * touches one concern (docs/adr/0019-small-files.md). Files that were already
 * longer when the rule came in are listed in oversize-baseline.json at their
 * length then: each may shrink but never grow, and leaves the list once it is
 * split. scripts/file-size.test.ts keeps the list exact, so it only tightens.
 */
export const MAX_LINES = 200;

export const OVERSIZE = JSON.parse(
  readFileSync(new URL('./oversize-baseline.json', import.meta.url), 'utf8'),
);

/** Lines as ESLint's max-lines counts them: a final newline adds none. */
export function countLines(text) {
  const lines = text.split(/\r\n|\r|\n/);
  if (lines.at(-1) === '') lines.pop();
  return lines.length;
}

const maxLines = (max) => ['error', { max, skipBlankLines: false, skipComments: false }];

/** The ESLint config blocks: the limit for every code file, then each baseline file's own. */
export function sizeLimits() {
  return [
    { files: ['**/*.{ts,js,mjs,cjs}'], rules: { 'max-lines': maxLines(MAX_LINES) } },
    ...Object.entries(OVERSIZE).map(([file, max]) => ({
      files: [file],
      rules: { 'max-lines': maxLines(max) },
    })),
  ];
}
