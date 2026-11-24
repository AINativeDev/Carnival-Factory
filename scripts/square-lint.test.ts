import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * The house rules in eslint.config.js, tried on red-team booths. Each snippet is
 * linted as if it were booths/grinch/booth.ts.
 */
const eslint = new ESLint({ cwd: `${import.meta.dirname}/..` });

async function problems(code: string, filePath = 'booths/grinch/booth.ts') {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId);
}

describe('booth house rules', () => {
  it('pass a booth that only draws with the map', async () => {
    expect(
      await problems(`
        import type { NorthPoleSquare } from '../../northpole/square';
        import { theme } from '../../northpole/theme';
        import { scene } from '../../northpole/diorama';
        import { wobble } from './wobble';
        export const booth: NorthPoleSquare = {
          owner: 'grinch',
          name: 'Cave',
          description: 'A cave.',
          draw(ctx, size, time) {
            scene(ctx, size, time, () => {});
            ctx.fillStyle = theme.colors.snow;
            ctx.fillRect(0, 0, size * wobble(time), size);
            setTimeout(() => {}, 10);
          },
        };
      `),
    ).toEqual([]);
  });

  it.each([
    ['a package', `import confetti from 'canvas-confetti';`],
    ['a node module', `import { readFileSync } from 'node:fs';`],
    ['another booth', `import other from '../jedi4ever/booth';`],
    ['a way out of its folder', `import x from './../jedi4ever/booth';`],
    ['the router', `import x from '../../main';`],
  ])('stop importing %s', async (_, code) => {
    expect(await problems(code)).toContain('no-restricted-imports');
  });

  it('pass a nested helper that imports the map and its own booth', async () => {
    expect(
      await problems(
        `
          import { theme } from '../../../northpole/theme';
          import { wobble } from '../wobble';
          import { star } from './star';
          export const colour = wobble(star(theme.colors.snow.length));
        `,
        'booths/grinch/lib/draw.ts',
      ),
    ).toEqual([]);
  });

  it.each([
    ['another booth', `import other from '../../jedi4ever/booth';`],
    ['a way out of its folder', `import x from '../../../main';`],
    ['the map at the wrong depth', `import x from '../../northpole/theme';`],
  ])('stop a nested helper importing %s', async (_, code) => {
    expect(await problems(code, 'booths/grinch/lib/draw.ts')).toContain('no-restricted-imports');
  });

  it.each([
    ['fetch', `fetch('https://example.com');`],
    ['XMLHttpRequest', `new XMLHttpRequest();`],
    ['WebSocket', `new WebSocket('wss://example.com');`],
    ['localStorage', `localStorage.getItem('score');`],
    ['sessionStorage', `sessionStorage.clear();`],
    ['window.parent', `window.parent.postMessage('hi', '*');`],
    ['window.top', `window.top.focus();`],
    ['window.open', `window.open('https://example.com');`],
    ['location writes', `location.href = 'https://example.com';`],
    ['window.location', `window.location.assign('https://example.com');`],
    ['document.cookie', `console.log(document.cookie);`],
    ['navigator.sendBeacon', `navigator.sendBeacon('https://example.com');`],
    ['window.WebSocket', `new window.WebSocket('wss://example.com');`],
    ['window.Worker', `new window.Worker('/worker.js');`],
    ['an alias of window', `const w = window; void w.fetch('https://example.com');`],
    ['globalThis', `void globalThis.fetch('https://example.com');`],
    ['self', `void self.fetch('https://example.com');`],
    ['the canvas back to the window', `void ctx.canvas.ownerDocument.defaultView.fetch('/');`],
    ['the Function constructor', `const f = (() => {}).constructor('return 1');`],
  ])('stop %s', async (_, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it.each([
    ['eval', `eval('1');`],
    ['new Function', `new Function('return 1');`],
    ['dynamic import()', `import('https://example.com/x.js');`],
    ['a string timer', `setTimeout('alert(1)', 10);`],
    ['a template string timer', 'setInterval(`alert(1)`, 10);'],
    ['a joined string timer', `setTimeout('alert(' + 1 + ')', 10);`],
  ])('stop %s', async (_, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it.each([
    ['a method', `const callbacks = { tick() {} }; setTimeout(callbacks.tick, 10);`],
    ['a bound method', `const a = { step() {} }; setInterval(a.step.bind(a), 10);`],
  ])('pass a timer given %s', async (_, code) => {
    expect(await problems(code)).toEqual([]);
  });

  it('let a test beside a booth import vitest, and nothing more', async () => {
    const file = 'booths/grinch/booth.test.ts';
    expect(
      await problems(
        `import { expect } from 'vitest'; import booth from './booth'; expect(booth).toBeDefined();`,
        file,
      ),
    ).toEqual([]);
    expect(await problems(`import { readFileSync } from 'node:fs';`, file)).toContain(
      'no-restricted-imports',
    );
    expect(await problems(`import { expect } from 'vitest';`)).toContain('no-restricted-imports');
  });

  it.each([
    ['the booth registry', `import { boothRegistry } from '../../northpole/booths';`],
    [
      'the attraction registry',
      `import { attractionRegistry } from '../../northpole/attractions';`,
    ],
    ['the kill switch', `import off from '../../northpole/disabled.json';`],
    ['the map', `import { startMap } from '../../northpole/map';`],
  ])('stop a booth from importing %s', async (_, code) => {
    expect(await problems(code)).toContain('no-restricted-imports');
  });

  it('stop a booth from importing a test file, but let a test import one', async () => {
    expect(await problems(`import { table } from './palette.test';`)).toContain(
      'no-restricted-imports',
    );
    expect(
      await problems(
        `import { table } from './palette.test'; export const t = table;`,
        'booths/grinch/booth.test.ts',
      ),
    ).toEqual([]);
  });

  it.each([
    ['process', `process.getBuiltinModule('node:fs').rmSync('northpole', { recursive: true });`],
    ['require', `require('node:fs').writeFileSync('x', '');`],
    ['global', `global.fetch('https://example.com');`],
    ['Buffer', `export const b = Buffer.from('x');`],
  ])("stop a booth's test from reaching Node through %s", async (_, code) => {
    expect(await problems(code, 'booths/grinch/booth.test.ts')).toContain('no-restricted-globals');
  });

  it('hold an attraction to the same rules', async () => {
    const file = 'attractions/big-top/attraction.ts';
    expect(
      await problems(
        `
          import type { NorthPoleSquare } from '../../northpole/square';
          import { theme } from '../../northpole/theme';
          import { wobble } from './wobble';
          export const colour = wobble(theme.colors.snow.length) as unknown as NorthPoleSquare;
        `,
        file,
      ),
    ).toEqual([]);
    expect(await problems(`fetch('https://example.com');`, file)).not.toEqual([]);
    expect(await problems(`localStorage.getItem('x');`, file)).not.toEqual([]);
    expect(await problems(`import x from '../../booths/jedi4ever/booth';`, file)).toContain(
      'no-restricted-imports',
    );
    expect(await problems(`import x from '../ferris-wheel/booth';`, file)).toContain(
      'no-restricted-imports',
    );
    expect(
      await problems(`import x from '../../main';`, 'attractions/big-top/lib/draw.ts'),
    ).toContain('no-restricted-imports');
  });

  it('leave the map itself alone', async () => {
    expect(await problems(`localStorage.getItem('x');`, 'northpole/map.ts')).toEqual([]);
  });
});
