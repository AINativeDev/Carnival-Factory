import { describe, expect, it } from 'vitest';
import { LINE, LINES, quillAt } from './square';

describe('quillAt', () => {
  it('writes each line of the page in turn, then starts again', () => {
    expect(quillAt(0)).toEqual({ line: 0, along: 0 });
    expect(quillAt(LINE * 1.5)).toEqual({ line: 1, along: 0.5 });
    expect(quillAt(LINE * LINES)).toEqual({ line: 0, along: 0 });
    expect(quillAt(-LINE / 2)).toEqual({ line: LINES - 1, along: 0.5 });
  });
});
