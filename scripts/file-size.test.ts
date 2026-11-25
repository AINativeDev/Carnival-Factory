import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAX_LINES, OVERSIZE, countLines } from '../lint/file-size.js';

const root = join(import.meta.dirname, '..');

// The baseline records debt, so it may only shrink: a file that got shorter must
// be written down at its new length, and a file split under the limit must leave
// the list, or the slack would let it grow back unnoticed.
describe('the oversize baseline only tightens', () => {
  // Files in carnival/ are skipped below: ESLint's max-lines stops them growing.
  it.each(Object.entries(OVERSIZE as Record<string, number>))('%s', (file, max) => {
    expect(existsSync(join(root, file)), `${file} is gone: remove it from the baseline`).toBe(true);
    const lines = countLines(readFileSync(join(root, file), 'utf8'));
    // A booth's pull request can't edit the baseline outside its folder, so a
    // carnival file only has to stay within its length; ESLint holds it there.
    if (file.startsWith('carnival/')) return;
    expect(
      lines,
      `${file} is ${lines} lines; set it to ${lines} in lint/oversize-baseline.json` +
        (lines <= MAX_LINES ? ', or better, remove it: it fits now' : ''),
    ).toBe(max);
    expect(lines).toBeGreaterThan(MAX_LINES);
  });
});
