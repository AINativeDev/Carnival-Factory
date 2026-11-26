import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOOTH_ONLY_SPECS, scopeOutput, smokeScope } from './smoke-scope';

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
    expect(smokeScope(['carnival/booths/ana/booth.ts', 'src/northpole/render.ts'])).toBeUndefined();
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

describe('scopeOutput', () => {
  it("prints the scope on its own line for git diff's list, or nothing for a full run", () => {
    expect(scopeOutput('carnival/booths/ana/booth.ts\n')).toBe('booth/ana\n');
    expect(scopeOutput('src/main.ts\n')).toBe('');
  });
});

describe('a booth-only run', () => {
  const specs = readdirSync(join(import.meta.dirname, '..', 'smoke')).filter((f) =>
    f.endsWith('.spec.ts'),
  );

  it('plays the booth, its screenshot and its flashing check, and nothing about the rest of the site', () => {
    expect(specs.filter((f) => BOOTH_ONLY_SPECS.test(f)).sort()).toEqual([
      'flashing.spec.ts',
      'squares-play.spec.ts',
    ]);
  });
});
