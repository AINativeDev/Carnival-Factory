import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const gate = readFileSync(
  join(import.meta.dirname, '..', '.github/workflows/auto-merge-booths.yml'),
  'utf8',
);

// A risk verdict on a new commit of a pull request already labelled low-risk
// changes no label, so the gate also starts on the verdict comment itself (#266),
// and only on that comment, from the Tessl App by its numeric id.
describe('the merge gate starts on the risk check verdict', () => {
  it('runs on new comments', () => {
    expect(gate).toMatch(/^ {2}issue_comment:\n {4}types: \[created\]$/m);
  });

  it("acts only on the Tessl App's risk verdict on a pull request", () => {
    expect(gate).toContain('github.event.issue.pull_request');
    expect(gate).toContain('github.event.comment.user.id == 295179765');
    expect(gate).toContain("contains(github.event.comment.body, '<!-- assess-booth-risk ')");
  });
});
