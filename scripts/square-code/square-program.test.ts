import { describe, expect, it } from 'vitest';
import { squareProgram } from './square-program.ts';
import { rules } from './test-booth.ts';

describe('squareProgram: the types the rules ask about', () => {
  it("knows the language's own library, so Math gives a number key", () => {
    expect(rules(`const a = [1, 2]; export const x = (t: number) => a[Math.floor(t)];`)).toEqual(
      [],
    );
  });

  it('checks strictly, so a key that may be undefined is not a number', () => {
    expect(rules(`export const x = (a: number[], i?: number) => a[i as number] + a[i];`)).toEqual([
      'computed-access',
    ]);
  });

  it('holds every file it is given, at its path from the root', () => {
    const program = squareProgram([
      { path: 'carnival/booths/elf/booth.ts', text: 'export const a = 1;' },
      { path: 'carnival/booths/elf/sky.ts', text: 'export const b = 2;' },
    ]);
    expect(program.getRootFileNames()).toEqual([
      '/carnival/booths/elf/booth.ts',
      '/carnival/booths/elf/sky.ts',
    ]);
    expect(program.getSourceFile('/carnival/booths/elf/sky.ts')?.text).toBe('export const b = 2;');
    expect(program.getCurrentDirectory()).toBe('/');
    expect(program.getCompilerOptions()).toMatchObject({
      strict: true,
      noEmit: true,
      lib: ['lib.es2022.d.ts'],
      types: [],
      allowImportingTsExtensions: true,
    });
  });

  it("resolves imports between a square's own files, even in a folder of its own", () => {
    // A number imported from another of the square's files is a number, so indexing with it is fine.
    const parts = { 'parts/keys.ts': 'export const first = 0;' };
    expect(
      rules(
        `import { first } from './parts/keys.ts';\nconst a = [1, 2];\nexport const x = a[first];`,
        parts,
      ),
    ).toEqual([]);
    const program = squareProgram([
      {
        path: 'carnival/booths/elf/booth.ts',
        text: "import { first } from './parts/keys.ts'; export const x = first;",
      },
      { path: 'carnival/booths/elf/parts/keys.ts', text: 'export const first = 0;' },
    ]);
    const booth = program.getSourceFile('/carnival/booths/elf/booth.ts');
    if (!booth) throw new Error('the booth file is missing');
    const errors = program.getSemanticDiagnostics(booth).map((d) => d.code);
    // 2307 is TypeScript's "Cannot find module".
    expect(errors).not.toContain(2307);
  });

  it("still reads the disk's folders, so a referenced library brings its types", () => {
    // The DOM's tabIndex is a number only if lib.dom.d.ts is found on the disk.
    expect(
      rules(
        `/// <reference lib="dom" />\nconst a = [1, 2];\nexport const x = (e: HTMLElement) => a[e.tabIndex];`,
      ),
    ).toEqual([]);
  });

  it('leaves an import of a file the square has not unresolved, so its value is not trusted', () => {
    expect(
      rules(`import { first } from './missing.ts';\nconst a = [1, 2];\nexport const x = a[first];`),
    ).toEqual(['computed-access']);
  });
});
