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
});
