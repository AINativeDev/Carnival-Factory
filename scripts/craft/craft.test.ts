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
    const undocumented = {
      ...good(),
      'scene.ts':
        'export function drawSky() {}\nexport class Sleigh {}\nexport type Sky = string;\n',
    };
    expect(craftOf(undocumented).problems).toEqual([
      'scene.ts: export drawSky has no doc comment saying what it is for.',
      'scene.ts: export Sleigh has no doc comment saying what it is for.',
    ]);
    const anonymous = { ...good(), 'scene.ts': 'drawSky();\nexport default function () {}\n' };
    expect(craftOf(anonymous).problems).toEqual([
      'scene.ts: export default has no doc comment saying what it is for.',
    ]);
  });

  it('counts a square without a README as saying too little', () => {
    const noReadme = good();
    delete noReadme['README.md'];
    expect(craftOf(noReadme).badges).not.toContain('documented');
  });

  it('withholds clear-names for generic names and file names that are not kebab-case', () => {
    const vague = { ...good(), 'scene.ts': `${doc('Sky.')}export const data = 1;\n` };
    expect(craftOf(vague).problems).toContain(
      'scene.ts: data says nothing about what it holds; name it for what it is in the scene.',
    );
    const shouty = { ...good(), 'MyScene.ts': `${doc('Sky.')}export const sky = 1;\n` };
    expect(craftOf(shouty).badges).not.toContain('clear-names');
    const nested = { ...good(), 'parts/Sky.ts': `${doc('Sky.')}export const sky = 1;\n` };
    expect(craftOf(nested).problems).toContain(
      'parts/Sky.ts: name files in kebab-case, such as penguin-pond.ts.',
    );
  });
});

describe('craftOf: where each convention draws its line', () => {
  it('counts lines up to 200, with or without a final newline', () => {
    expect(craftOf({ ...good(), 'scene.ts': lines(200) }).badges).toContain('small-files');
    expect(craftOf({ ...good(), 'scene.ts': `${lines(200)}\n` }).badges).toContain('small-files');
    expect(craftOf({ ...good(), 'scene.ts': `${lines(200)}\n\n` }).problems).toContain(
      'scene.ts is 201 lines; split it so each file has 200 or fewer.',
    );
  });

  it('holds JavaScript to the size too, but not words or files that only end like code', () => {
    expect(craftOf({ ...good(), 'scene.js': lines(201) }).badges).not.toContain('small-files');
    const words = { ...good(), 'notes.tsv': lines(300), 'scene.ts.txt': lines(300) };
    expect(craftOf(words).badges).toContain('small-files');
  });

  it('wants a test that imports the square, not only another test', () => {
    const others = {
      ...good(),
      'booth.test.ts': `import { it } from 'vitest';\nimport { shared } from './shared.test';\nimport { up } from '../up';\nit('runs', () => shared(up));\n`,
    };
    expect(craftOf(others).problems).toEqual([
      'booth.test.ts tests nothing of the square: import its code and check what it does.',
    ]);
    expect(craftOf(others).badges).toEqual(['small-files', 'documented', 'clear-names']);
    const noTest = good();
    delete noTest['booth.test.ts'];
    expect(craftOf(noTest).problems).toEqual([
      'No test: add a .test.ts that checks what the square does, written first.',
    ]);
    const notATest = { ...noTest, 'booth.test.tsx': `import { penguinAt } from './booth';\n` };
    expect(craftOf(notATest).badges).not.toContain('tested');
  });

  it('counts a README of fifteen words as enough, and only words with letters in them', () => {
    const words = (count: number) => Array.from({ length: count }, () => 'snow').join(' ');
    expect(craftOf({ ...good(), 'README.md': `# — ${words(15)}\n` }).badges).toContain(
      'documented',
    );
    expect(craftOf({ ...good(), 'README.md': `# — - ${words(14)} *\n` }).badges).not.toContain(
      'documented',
    );
    expect(craftOf({ ...good(), 'README.md': words(15).replaceAll(' ', '\n\t') }).badges).toContain(
      'documented',
    );
  });

  it('wants a doc comment on each export itself, not a plain comment or one higher up', () => {
    const scene = `${doc('The sky.')}export const sky = 1;\n/* The moon. */\nexport const moon = 2;\n// The sun.\nexport const sun = 3;\nexport const star = 4, comet = 5;\n${doc('The glow.')}// Bright at dusk.\nexport const glow = 6;\n`;
    expect(craftOf({ ...good(), 'scene.ts': scene }).problems).toEqual([
      'scene.ts: export moon has no doc comment saying what it is for.',
      'scene.ts: export sun has no doc comment saying what it is for.',
      'scene.ts: export star has no doc comment saying what it is for.',
      'scene.ts: export comet has no doc comment saying what it is for.',
    ]);
  });

  it('asks no doc comment of what is not exported, nor of the tests', () => {
    const scene = `const sky = 1;\nasync function glow() {}\ndeclare const moon: number;\nexport type Sky = number;\nexport interface Moon { size: number }\nexport { sky, glow, moon };\n`;
    const helper = `import { penguinAt } from './booth';\nexport const pond = penguinAt(1);\n`;
    expect(craftOf({ ...good(), 'scene.ts': scene, 'pond.test.ts': helper }).problems).toEqual([]);
  });

  it('names every generic declaration once: variables, functions, classes and parameters', () => {
    const scene = `${doc('Sky.')}export function sky(temp: number, glow: number) {\n  const data = temp;\n  const { stuff } = { stuff: glow };\n  return data + stuff;\n}\n${doc('Moon.')}export function helper() {}\n${doc('Sun.')}export class Manager {}\nfunction moon() { const data = 1; return data; }\nmoon();\n`;
    const found = (name: string) =>
      `scene.ts: ${name} says nothing about what it holds; name it for what it is in the scene.`;
    expect(craftOf({ ...good(), 'scene.ts': scene }).problems).toEqual([
      found('temp'),
      found('data'),
      found('helper'),
      found('Manager'),
    ]);
  });

  it('wants kebab-case file names, with README.md the only exception', () => {
    const named = (name: string) => craftOf({ ...good(), [name]: 'A note.' }).problems;
    const wrong = ['NOTES.md', 'notes_v2.md', 'notes', '-notes.md', 'notes-.md', 'notes.MD'];
    for (const name of [...wrong, 'notes.v2.md', 'notes.md~'])
      expect(named(name)).toEqual([`${name}: name files in kebab-case, such as penguin-pond.ts.`]);
    for (const name of ['notes.md', 'penguin-pond-2.md', 'sky.data.json', 'a/b/notes.md'])
      expect(named(name)).toEqual([]);
  });

  it('reads names only from code, and only the ones it declares', () => {
    const scene = `${doc('Sky.')}export const sky = { data: 1, temp() {} };
sky.data = sky.temp.length;
`;
    expect(craftOf({ ...good(), 'scene.ts': scene, 'notes.md': 'let data = 1;' }).problems).toEqual(
      [],
    );
  });

  it('counts an empty code file as one line', () => {
    expect(craftOf({ ...good(), 'scene.ts': '' }).badges).toContain('small-files');
  });
});
