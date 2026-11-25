import { describe, expect, it } from 'vitest';
import { MAX_LINES, countLines, sizeLimits } from '../lint/file-size.js';

describe('code files stay under 200 lines, with no exceptions', () => {
  it('holds every code file to the one limit', () => {
    expect(MAX_LINES).toBe(200);
    expect(sizeLimits()).toEqual([
      {
        files: ['**/*.{ts,js,mjs,cjs}'],
        rules: { 'max-lines': ['error', { max: 200, skipBlankLines: false, skipComments: false }] },
      },
    ]);
  });

  it('counts lines as ESLint does: a final newline adds none', () => {
    expect(countLines('a\nb\n')).toBe(2);
    expect(countLines('a\r\nb')).toBe(2);
  });
});
