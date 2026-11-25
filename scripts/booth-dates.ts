/**
 * When each booth's folder first appeared, read from git history at build
 * time, for the Booths panel's Recently added. Plain functions, and one that
 * runs git, which the build calls.
 */
import { execFileSync } from 'node:child_process';

/**
 * Reads `git log --diff-filter=A --format=%x00%aI --name-only` over the booths'
 * files: each commit is a NUL, its date, then the files it added. The log runs
 * newest first, so the last date seen for a booth is when it first appeared.
 * Keys are logins in lower case.
 */
export function boothAddedDates(log: string): Record<string, string> {
  const added: Record<string, string> = {};
  for (const commit of log.split('\0')) {
    const [date, ...files] = commit.split('\n').map((line) => line.trim());
    if (!date || Number.isNaN(Date.parse(date))) continue;
    for (const file of files) {
      const booth = file.match(/^(?:carnival\/)?booths\/([a-z0-9-]+)\/booth\.ts$/i);
      if (booth) added[booth[1].toLowerCase()] = date;
    }
  }
  return added;
}

/** Each booth's first appearance from the git history in `root`, or nothing when git can't tell. */
export function readBoothAddedDates(root: string): Record<string, string> {
  try {
    const log = execFileSync(
      'git',
      [
        'log',
        '--diff-filter=A',
        '--format=%x00%aI',
        '--name-only',
        '--',
        'carnival/booths/*/booth.ts',
        'booths/*/booth.ts',
      ],
      { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 },
    ).toString();
    return boothAddedDates(log);
  } catch {
    return {};
  }
}
