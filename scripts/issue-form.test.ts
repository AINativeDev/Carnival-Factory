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
});
