/**
 * A GitHub for the tests of the scripts that read it: it answers each path from
 * a table, says yes to the paths `exists` should find, and keeps every path it
 * was asked for, so a test can see what a script read and what it never did.
 */
import type { GitHubReader } from '../github-api.ts';

export function fakeGitHub(
  answers: Record<string, unknown>,
  found: readonly string[] = [],
): GitHubReader & { asked: string[] } {
  const asked: string[] = [];
  const read = (path: string): unknown => {
    asked.push(path);
    return answers[path];
  };
  return {
    asked,
    get: <T>(path: string) => Promise.resolve(read(path) as T | undefined),
    exists: (path: string) => {
      asked.push(path);
      return Promise.resolve(found.includes(path));
    },
    getAll: <T>(path: string) => Promise.resolve((read(path) as T[] | undefined) ?? []),
  };
}
