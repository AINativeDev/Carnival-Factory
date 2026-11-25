import { describe, expect, it } from 'vitest';
import { jsonProblem } from './check-json';

describe('jsonProblem', () => {
  it('accepts valid JSON', () => {
    expect(jsonProblem('{ "booths": [] }')).toBeUndefined();
  });

  it('says why broken JSON fails, such as a trailing comma', () => {
    expect(jsonProblem('{ "booths": [], }')).toMatch(/JSON/);
  });
});
