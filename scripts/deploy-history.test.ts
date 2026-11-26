import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pages = readFileSync(join(import.meta.dirname, '..', '.github/workflows/pages.yml'), 'utf8');
const step = pages.slice(pages.indexOf("- name: Read every square's history"));
const historyStep = step.slice(0, step.indexOf('\n      - name:', 10));

// Reading every issue and pull request is the costliest call on the API budget
// the workflows share, so a deploy that merged nothing reuses the published
// history (docs/adr/0054-history-only-after-a-merge.md).
describe("the deploy's square history", () => {
  it('is read afresh only after a merge: a push, or the gate publishing its own merge', () => {
    expect(historyStep).toContain('[ "$EVENT" != push ] && [ "$EVENT" != workflow_dispatch ]');
    expect(historyStep).toContain('cp ../site/square-history.json square-history.json');
    expect(historyStep).toContain('node scripts/write-square-history.ts');
  });

  it('is published beside the page, for the next deploy to reuse', () => {
    expect(pages).toContain(
      'if [ -s square-history.json ]; then cp square-history.json ../site/; fi',
    );
  });
});
