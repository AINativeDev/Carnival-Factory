/**
 * The paths the docs name must exist, so a rename or a removal can't leave the
 * specs, the ADRs or AGENTS.md pointing at nothing, as moving the squares into
 * carnival/ nearly did (docs/adr/0001-record-decisions.md). It catches stale
 * references; whether the prose still describes the code is the review-craft
 * lens's job.
 */
export const ROOTS = [
  'src/',
  'scripts/',
  'lint/',
  'smoke/',
  'docs/',
  'carnival/',
  'plugins/',
  '.github/',
];

/**
 * The repository paths named in backticks in a document, with placeholders
 * like `<login>` and globs left out, since they name a pattern, not a file.
 */
export function namedPaths(markdown: string): string[] {
  const paths = new Set<string>();
  for (const [, code = ''] of markdown.matchAll(/`([^`\s]+)`/g)) {
    const path = code.replace(/[.,:;]$/, '').replace(/\/$/, '');
    if (!ROOTS.some((root) => path.startsWith(root))) continue;
    if (/[<>*{}$]/.test(path)) continue;
    paths.add(path);
  }
  return [...paths].sort();
}
