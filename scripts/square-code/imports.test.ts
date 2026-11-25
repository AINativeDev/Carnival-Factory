import { describe, expect, it } from 'vitest';
import { checkSquareCode } from '../square-code.ts';
import { rules } from './test-booth.ts';

/** The rules a file at `path` in `folder` breaks when it imports `specifier`. */
const importing = (folder: string, path: string, specifier: string) =>
  checkSquareCode(folder, [
    { path: `${folder}${path}`, text: `import { a } from '${specifier}';\nexport default a;` },
  ]).map((problem) => problem.rule);

describe("a square's imports", () => {
  it.each(['theme', 'square', 'diorama'])("lets booth.ts import the map's %s", (name) => {
    expect(importing('carnival/booths/elf/', 'booth.ts', `../../../src/northpole/${name}`)).toEqual(
      [],
    );
  });

  it.each([
    ['too few ../', 'booth.ts', '../../src/northpole/theme'],
    ['too many ../', 'booth.ts', '../../../../src/northpole/theme'],
    ['another part of the map', 'booth.ts', '../../../src/northpole/booths'],
    ['the map with an extension', 'booth.ts', '../../../src/northpole/theme.ts'],
    ['the map by a bare path', 'booth.ts', 'src/northpole/theme'],
    ['the map by an absolute path', 'booth.ts', '/src/northpole/theme'],
    ['another booth', 'booth.ts', '../jedi4ever/booth'],
    ['a folder that only starts with its name', 'booth.ts', '../elf-twin/booth'],
    ['a way out through its own folder', 'booth.ts', './lib/../../jedi4ever/booth'],
    ['a package', 'booth.ts', 'some-package'],
    ['vitest, outside a test', 'booth.ts', 'vitest'],
    ['its own test', 'booth.ts', './booth.test'],
    ['its own test, by its file name', 'booth.ts', './booth.test.ts'],
  ])('stops %s', (_, path, specifier) => {
    expect(importing('carnival/booths/elf/', path, specifier)).toContain('import');
  });

  it('lets a test import vitest, its own folder and its own tests', () => {
    for (const specifier of ['vitest', './booth', './other.test', './lib/a.test.ts'])
      expect(importing('carnival/booths/elf/', 'booth.test.ts', specifier)).toEqual([]);
    expect(importing('carnival/booths/elf/', 'booth.test.ts', '../jedi4ever/booth')).toContain(
      'import',
    );
  });

  it("lets a level's square import the map five folders up, and a nested file one more", () => {
    const folder = 'carnival/levels/elf/squares/tree/';
    expect(importing(folder, 'square.ts', '../../../../../src/northpole/theme')).toEqual([]);
    expect(importing(folder, 'lib/a.ts', '../../../../../../src/northpole/square')).toEqual([]);
    expect(importing(folder, 'square.ts', '../../../src/northpole/theme')).toContain('import');
    expect(importing(folder, 'square.ts', '../../other/square')).toContain('import');
  });

  it('holds re-exports to the same rules', () => {
    expect(rules(`export { theme } from '../../../src/northpole/theme';`)).toEqual([]);
    expect(rules(`export * from '../../../src/northpole/booths';`)).toContain('import');
    expect(rules(`export * from 'some-package';`)).toContain('import');
  });

  it('stops an import by require', () => {
    expect(rules(`import x = require('some-package');\nexport default x;`)).toContain('top-level');
  });
});

describe('checkSquareCode, on imports', () => {
  it('catches imports outside the map and the square', () => {
    expect(rules(`import x from '../../../src/northpole/booths';\nexport default x;`)).toContain(
      'import',
    );
    expect(rules(`import x from '../jedi4ever/booth';\nexport default x;`)).toContain('import');
    expect(rules(`import x from 'some-package';\nexport default x;`)).toContain('import');
    expect(rules(`export const x = () => import('./other');`)).toContain('import');
    expect(rules(`export const x = import.meta.url;`)).toContain('import');
  });

  it('lets a square import its own files, but not its tests', () => {
    expect(
      rules(`import { a } from './lib/a';\nexport default a;`, {
        'lib/a.ts': 'export const a = 1;',
      }),
    ).toEqual([]);
    expect(
      rules(`import { a } from './a.test';\nexport default a;`, {
        'a.test.ts': 'export const a = 1;',
      }),
    ).toContain('import');
  });

  it('lets a nested file import the map by its own depth, but nothing else of the map', () => {
    const lib = (text: string) => ({ 'lib/draw.ts': text });
    const main = `import { a } from './lib/draw';\nexport default a;`;
    expect(
      rules(
        main,
        lib(`import { theme } from '../../../../src/northpole/theme';\nexport const a = theme;`),
      ),
    ).toEqual([]);
    expect(
      rules(
        main,
        lib(`import { scene } from '../../../../src/northpole/diorama';\nexport const a = scene;`),
      ),
    ).toEqual([]);
    expect(
      rules(
        main,
        lib(`import { theme } from '../../../src/northpole/theme';\nexport const a = theme;`),
      ),
    ).toContain('import');
    expect(
      rules(main, lib(`import { x } from '../../../../src/northpole/map';\nexport const a = x;`)),
    ).toContain('import');
  });
});
