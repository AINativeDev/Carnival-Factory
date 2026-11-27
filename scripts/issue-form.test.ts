import { describe, expect, it } from 'vitest';
import { formField } from './issue-form.ts';

const body = `### Your repository

https://github.com/octocat/workshop

### A pull request the factory opened there

https://github.com/octocat/workshop/pull/12
`;

describe('formField', () => {
  it('reads each field', () => {
    expect(formField(body, 'Your repository')).toBe('https://github.com/octocat/workshop');
    expect(formField(body, 'A pull request the factory opened there')).toBe(
      'https://github.com/octocat/workshop/pull/12',
    );
  });

  it('has nothing for an empty or missing field', () => {
    expect(formField('### Your repository\n\n_No response_\n', 'Your repository')).toBeUndefined();
    expect(formField('hello', 'Your repository')).toBeUndefined();
  });

  it('reads a field of many lines, whatever line endings it has, up to the next heading', () => {
    const windows = '### Notes  \r\nfirst\r\nsecond\rthird\n### Next\nlater';
    expect(formField(windows, 'Notes')).toBe('first\nsecond\nthird');
  });

  it('reads the first heading’s field when it is the first line, to the end', () => {
    expect(formField('### Notes\nonly', 'Notes')).toBe('only');
    expect(formField('### Notes\n### Next\nlater', 'Notes')).toBeUndefined();
  });
});
