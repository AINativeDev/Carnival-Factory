import { describe, expect, it } from 'vitest';
import { craftOf, type SquareFiles } from './craft';

const doc = (text: string) => `/** ${text} */\n`;
const lines = (count: number) => Array.from({ length: count }, (_, n) => `// line ${n}`).join('\n');

/** A square that meets every convention, to break one way at a time. */
const good = (): SquareFiles => ({
  'booth.ts': `${doc('The penguin pond, drawn at dusk.')}const booth = { id: 'ana' };\nexport default booth;\n${doc('Where the penguin is at a time.')}export function penguinAt(time: number) {\n  return time;\n}\n`,
  'booth.test.ts': `import { it, expect } from 'vitest';\nimport { penguinAt } from './booth';\nit('moves', () => expect(penguinAt(1)).toBe(1));\n`,
  'README.md': `# Penguin pond\n\nA frozen pond at dusk where two penguins skate figure eights and a third holds a mug of cocoa that steams in the cold.\n`,
});

describe('craftOf: the badges a square earns', () => {
  it('gives every badge to a square that meets every convention', () => {
    expect(craftOf(good())).toEqual({
      badges: ['small-files', 'tested', 'documented', 'clear-names'],
      problems: [],
    });
  });

  it('withholds small-files for a code file over 200 lines, and says which', () => {
    const files = { ...good(), 'scene.ts': lines(201) };
    const craft = craftOf(files);
    expect(craft.badges).not.toContain('small-files');
    expect(craft.problems).toContain(
      'scene.ts is 201 lines; split it so each file has 200 or fewer.',
    );
  });

  it('withholds tested without a test that imports the square', () => {
    const noTest = good();
    delete noTest['booth.test.ts'];
    expect(craftOf(noTest).badges).not.toContain('tested');
    const hollow = {
      ...good(),
      'booth.test.ts': `import { it } from 'vitest';\nit('runs', () => {});\n`,
    };
    expect(craftOf(hollow).problems).toContain(
      'booth.test.ts tests nothing of the square: import its code and check what it does.',
    );
  });

  it('withholds documented for a thin README or an export without a doc comment', () => {
    expect(craftOf({ ...good(), 'README.md': '# Pond\n' }).problems).toContain(
      'README.md says too little: describe what the square shows and does, in a few sentences.',
    );
    const bare = { ...good(), 'scene.ts': 'export const sky = 1;\n' };
    expect(craftOf(bare).problems).toContain(
      'scene.ts: export sky has no doc comment saying what it is for.',
    );
  });

  it('withholds clear-names for generic names and file names that are not kebab-case', () => {
    const vague = { ...good(), 'scene.ts': `${doc('Sky.')}export const data = 1;\n` };
    expect(craftOf(vague).problems).toContain(
      'scene.ts: data says nothing about what it holds; name it for what it is in the scene.',
    );
    const shouty = { ...good(), 'MyScene.ts': `${doc('Sky.')}export const sky = 1;\n` };
    expect(craftOf(shouty).badges).not.toContain('clear-names');
  });
});
