/**
 * Checks squares' craft from the command line, for the factory, the agent hooks
 * and the deploy (docs/adr/0029-booth-craft.md).
 *
 *   node scripts/craft/check-square.ts carnival/booths/<login> [more folders]
 *     prints each square's badges and what to fix; fails if anything's left.
 *   node scripts/craft/check-square.ts --all <out.json>
 *     writes every square's badges, for the panel, and never fails.
 */
import { safePath } from '../safe-path.ts';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { craftOf, type Craft, type SquareFiles } from './craft.ts';

/** Every file under a square's folder, by its path inside it; the folder must be in the repository. */
export function readSquare(given: string): SquareFiles {
  const folder = safePath(given);
  const files: SquareFiles = {};
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else files[relative(folder, path)] = readFileSync(path, 'utf8');
    }
  };
  walk(folder);
  // A level's squares share the level's README, which says what each one is.
  const levelReadme = join(dirname(dirname(folder)), 'README.md');
  if (
    !files['README.md'] &&
    /\/levels\/[^/]+\/squares\//.test(`/${folder}`) &&
    existsSync(levelReadme)
  )
    files['README.md'] = readFileSync(levelReadme, 'utf8');
  return files;
}

/** Every square's folder: each booth, attraction and level's own square. */
export function squareFolders(root: string): string[] {
  const inside = (dir: string) =>
    readdirSync(join(root, dir))
      .map((name) => `${dir}/${name}`)
      .filter((path) => statSync(join(root, path)).isDirectory());
  return [
    ...inside('carnival/booths'),
    ...inside('carnival/attractions'),
    ...inside('carnival/levels').flatMap((level) => inside(`${level}/squares`)),
  ];
}

/** A square's report, as a person or an agent reads it. */
export function report(folder: string, craft: Craft): string {
  const earned = craft.badges.length ? craft.badges.join(', ') : 'none yet';
  const todo = craft.problems.map((problem) => `  - ${problem}`).join('\n');
  return `${folder}: ${earned}${todo ? `\n${todo}` : ''}`;
}

/* v8 ignore start -- the command-line entry point */
if (process.argv[1]?.endsWith('check-square.ts')) {
  const args = process.argv.slice(2);
  if (args[0] === '--all') {
    const all = Object.fromEntries(
      squareFolders('.').map((folder) => [folder, craftOf(readSquare(folder)).badges]),
    );
    writeFileSync(safePath(args[1] ?? 'craft.json'), `${JSON.stringify(all, null, 2)}\n`);
  } else {
    let left = 0;
    for (const folder of args) {
      const craft = craftOf(readSquare(folder));
      left += craft.problems.length;
      console.log(report(folder, craft));
    }
    if (left) process.exit(1);
  }
}
/* v8 ignore stop */
