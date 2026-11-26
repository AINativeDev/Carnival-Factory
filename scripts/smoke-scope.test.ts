import { describe, expect, it } from 'vitest';
import { scopeOutput, smokeScope } from './smoke-scope';

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

  it("plays just the level and its squares when only that level's folder changes", () => {
    expect(
      smokeScope([
        'carnival/levels/ana/level.ts',
        'carnival/levels/ana/squares/cocoa/square.ts',
        'carnival/levels/ana/README.md',
      ]),
    ).toBe('level/ana');
  });

  it('plays everything when a level changes with a booth, another level or anything else', () => {
    expect(
      smokeScope(['carnival/levels/ana/level.ts', 'carnival/booths/ana/booth.ts']),
    ).toBeUndefined();
    expect(
      smokeScope(['carnival/levels/ana/level.ts', 'carnival/levels/bo/level.ts']),
    ).toBeUndefined();
    expect(smokeScope(['carnival/levels/ana/level.ts', 'src/northpole/level.ts'])).toBeUndefined();
    expect(smokeScope(['carnival/levels/README.md'])).toBeUndefined();
    expect(smokeScope(['carnival/levels/Ana/level.ts'])).toBeUndefined();
    expect(smokeScope(['carnival/constructor/ana/level.ts'])).toBeUndefined();
  });
});

describe('scopeOutput', () => {
  it("prints the scope on its own line for git diff's list, or nothing for a full run", () => {
    expect(scopeOutput('carnival/booths/ana/booth.ts\n')).toBe('booth/ana\n');
    expect(scopeOutput('src/main.ts\n')).toBe('');
  });
});
