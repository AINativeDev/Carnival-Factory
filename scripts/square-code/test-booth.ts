/**
 * A made-up booth for the code check's tests: the grinch's folder, a booth.ts
 * that only draws, and the rules a booth breaks when its booth.ts is some
 * other code. Every rule family's tests share it, so they all check the same
 * entry point the merge gate calls.
 */
import { checkSquareCode } from '../square-code.ts';

const FOLDER = 'carnival/booths/grinch/';

/** The problems a booth has when its booth.ts is `code` and its other files are `extra`. */
export const problems = (code: string, extra: Record<string, string> = {}) =>
  checkSquareCode(FOLDER, [
    { path: `${FOLDER}booth.ts`, text: code },
    ...Object.entries(extra).map(([name, text]) => ({ path: `${FOLDER}${name}`, text })),
  ]);

/** The rules a booth breaks when its booth.ts is `code`. */
export const rules = (code: string, extra: Record<string, string> = {}) =>
  problems(code, extra).map((problem) => problem.rule);

export const fine = `import type { NorthPoleSquare } from '../../../src/northpole/square';
import { theme } from '../../../src/northpole/theme';
const stars = [1, 2, 3];
function wave(time: number) { return Math.sin(time / 300); }
const booth: NorthPoleSquare = {
  id: 'grinch', name: 'Grinch', description: 'A cave.',
  draw(ctx, size, time) {
    const top = size * 0.2;
    ctx.fillStyle = theme.colors.snow;
    for (let i = 0; i < stars.length; i++) ctx.fillRect(stars[i] * top, wave(time), 2, 2);
  },
};
export default booth;
`;
