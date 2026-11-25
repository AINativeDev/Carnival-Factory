import { describe, expect, it } from 'vitest';
import { BODIES, HANDLES, partsOf, STRIPES } from './parts';

describe('partsOf', () => {
  it('names the parts a top is built from', () => {
    expect(partsOf({ body: 1, stripe: 2, handle: 2 })).toEqual({
      body: BODIES[1],
      stripe: STRIPES[2],
      handle: HANDLES[2],
    });
  });

  it('falls back to the first of each part for an index off the end of its list', () => {
    expect(partsOf({ body: 9, stripe: 9, handle: 9 })).toEqual({
      body: BODIES[0],
      stripe: STRIPES[0],
      handle: HANDLES[0],
    });
  });
});
