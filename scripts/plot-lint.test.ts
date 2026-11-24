import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * The house rules in eslint.config.js, tried on red-team plots. Each snippet is
 * linted as if it were src/plots/grinch/plot.ts.
 */
const eslint = new ESLint({ cwd: `${import.meta.dirname}/..` });

async function problems(code: string, filePath = 'src/plots/grinch/plot.ts') {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId);
}

describe('plot house rules', () => {
  it('pass a plot that only draws with the map', async () => {
    expect(
      await problems(`
        import type { NorthPolePlot } from '../../northpole/plot';
        import { theme } from '../../northpole/theme';
        import { wobble } from './wobble';
        export const plot: NorthPolePlot = {
          owner: 'grinch',
          name: 'Cave',
          description: 'A cave.',
          draw(ctx, size, time) {
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
    ['another plot', `import other from '../jedi4ever/plot';`],
    ['a way out of its folder', `import x from './../jedi4ever/plot';`],
    ['the router', `import x from '../../main';`],
  ])('stop importing %s', async (_, code) => {
    expect(await problems(code)).toContain('no-restricted-imports');
  });

  it('pass a nested helper that imports the map and its own plot', async () => {
    expect(
      await problems(
        `
          import { theme } from '../../../northpole/theme';
          import { wobble } from '../wobble';
          import { star } from './star';
          export const colour = wobble(star(theme.colors.snow.length));
        `,
        'src/plots/grinch/lib/draw.ts',
      ),
    ).toEqual([]);
  });

  it.each([
    ['another plot', `import other from '../../jedi4ever/plot';`],
    ['a way out of its folder', `import x from '../../../main';`],
    ['the map at the wrong depth', `import x from '../../northpole/theme';`],
  ])('stop a nested helper importing %s', async (_, code) => {
    expect(await problems(code, 'src/plots/grinch/lib/draw.ts')).toContain('no-restricted-imports');
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

  it('let a test beside a plot import vitest, and nothing more', async () => {
    const file = 'src/plots/grinch/plot.test.ts';
    expect(
      await problems(
        `import { expect } from 'vitest'; import plot from './plot'; expect(plot).toBeDefined();`,
        file,
      ),
    ).toEqual([]);
    expect(await problems(`import { readFileSync } from 'node:fs';`, file)).toContain(
      'no-restricted-imports',
    );
    expect(await problems(`import { expect } from 'vitest';`)).toContain('no-restricted-imports');
  });

  it('hold an attraction to the same rules', async () => {
    const file = 'src/attractions/big-top/plot.ts';
    expect(
      await problems(
        `
          import type { NorthPolePlot } from '../../northpole/plot';
          import { theme } from '../../northpole/theme';
          import { wobble } from './wobble';
          export const colour = wobble(theme.colors.snow.length) as unknown as NorthPolePlot;
        `,
        file,
      ),
    ).toEqual([]);
    expect(await problems(`fetch('https://example.com');`, file)).not.toEqual([]);
    expect(await problems(`localStorage.getItem('x');`, file)).not.toEqual([]);
    expect(await problems(`import x from '../../plots/jedi4ever/plot';`, file)).toContain(
      'no-restricted-imports',
    );
    expect(await problems(`import x from '../ferris-wheel/plot';`, file)).toContain(
      'no-restricted-imports',
    );
    expect(
      await problems(`import x from '../../main';`, 'src/attractions/big-top/lib/draw.ts'),
    ).toContain('no-restricted-imports');
  });

  it('leave the map itself alone', async () => {
    expect(await problems(`localStorage.getItem('x');`, 'src/northpole/map.ts')).toEqual([]);
  });
});
