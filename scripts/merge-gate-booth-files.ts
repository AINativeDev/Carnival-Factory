/**
 * Reads a booth's folder at the pull request's head commit, as text through
 * the API, for the static code check. It never checks out or runs the pull
 * request's files (docs/specs/auto-merge-gate.md).
 */
import { get, type GitHub } from './merge-gate-github.ts';
import type { CodeProblem, SourceFile } from './square-code.ts';

/** The only kinds of file a booth may hold and still merge without a person. */
const TEXT_FILES = /\.(ts|md)$/;
/** Limits on what the gate reads and compiles, checked from the tree before any file is loaded. */
const MAX_FILES = 40;
const MAX_FILE_BYTES = 100 * 1024;
const MAX_TOTAL_BYTES = 300 * 1024;

interface TreeEntry {
  path: string;
  type: string;
  sha: string;
  mode: string;
  size?: number;
}

const problem = (file: string, message: string): CodeProblem => ({
  file,
  line: 0,
  rule: 'files',
  message,
});

/**
 * Every file in the booth's folder at the head commit, read as text, plus any
 * problem with what the folder holds. Sizes are checked from the tree first,
 * so an oversized booth goes to a person without being loaded or compiled.
 */
export async function boothFiles(
  github: GitHub,
  sha: string,
  owner: string,
): Promise<{ files: SourceFile[]; problems: CodeProblem[] }> {
  const folder = `carnival/booths/${owner}/`;
  const tree = await get<{ tree: TreeEntry[]; truncated: boolean }>(
    github,
    `git/trees/${sha}?recursive=1`,
  );
  const files: SourceFile[] = [];
  if (tree.truncated)
    return { files, problems: [problem(folder, 'The tree is too large to check.')] };

  const entries = tree.tree.filter((e) => e.path.startsWith(folder) && e.type === 'blob');
  const total = entries.reduce((sum, e) => sum + (e.size ?? 0), 0);
  const tooBig = entries.find((e) => (e.size ?? 0) > MAX_FILE_BYTES);
  if (entries.length > MAX_FILES || total > MAX_TOTAL_BYTES || tooBig) {
    const limits = `at most ${String(MAX_FILES)} files, ${String(MAX_FILE_BYTES / 1024)} KB each and ${String(MAX_TOTAL_BYTES / 1024)} KB in all`;
    return {
      files,
      problems: [problem(tooBig?.path ?? folder, `Too large to check on its own: ${limits}.`)],
    };
  }
  const problems: CodeProblem[] = [];
  for (const entry of entries) {
    const plotFile = entry.path === `${folder}plot.json`;
    if (entry.mode === '120000' || !(TEXT_FILES.test(entry.path) || plotFile)) {
      problems.push(
        problem(entry.path, 'Only .ts and .md files, and plot.json, merge without a person.'),
      );
      continue;
    }
    const blob = await get<{ content: string }>(github, `git/blobs/${entry.sha}`);
    files.push({ path: entry.path, text: Buffer.from(blob.content, 'base64').toString('utf8') });
  }
  return { files, problems };
}
