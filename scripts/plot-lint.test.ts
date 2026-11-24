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
  ])('stop %s', async (_, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it.each([
    ['eval', `eval('1');`],
    ['new Function', `new Function('return 1');`],
    ['dynamic import()', `import('https://example.com/x.js');`],
    ['a string timer', `setTimeout('alert(1)', 10);`],
    ['a template string timer', 'setInterval(`alert(1)`, 10);'],
  ])('stop %s', async (_, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it('leave the map itself alone', async () => {
    expect(await problems(`localStorage.getItem('x');`, 'src/northpole/map.ts')).toEqual([]);
  });
});
