import { describe, expect, it } from 'vitest';
import { smokeScope } from './smoke-scope';

describe('smokeScope', () => {
  it("plays just the booth when only that booth's folder changes", () => {
    expect(smokeScope(['carnival/booths/ana/booth.ts', 'carnival/booths/ana/README.md', ''])).toBe(
      'booth/ana',
    );
  });

  it('plays everything when anything outside one booth changes', () => {
    expect(
      smokeScope(['carnival/booths/ana/booth.ts', 'carnival/booths/bo/booth.ts']),
    ).toBeUndefined();
    expect(smokeScope(['carnival/booths/ana/booth.ts', 'northpole/render.ts'])).toBeUndefined();
    expect(smokeScope(['carnival/attractions/ferris-wheel/attraction.ts'])).toBeUndefined();
    expect(smokeScope(['carnival/booths/README.md'])).toBeUndefined();
    expect(smokeScope(['booths/ana/booth.ts'])).toBeUndefined();
    expect(smokeScope([])).toBeUndefined();
  });

  it('plays everything for a folder name that is not a login', () => {
    expect(smokeScope(['carnival/booths/Ana/booth.ts'])).toBeUndefined();
    expect(smokeScope(['carnival/booths/a b/booth.ts'])).toBeUndefined();
    expect(smokeScope(['carnival/booths/-ana/booth.ts'])).toBeUndefined();
  });
});
