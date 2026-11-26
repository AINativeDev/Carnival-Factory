/**
 * Pins what the merge gate's runner does with a booth pull request that passes
 * every step: the checklist comment, the merge pinned to the head commit, the
 * note on the request and its closing, and publishing the map.
 */
import { describe, expect, it } from 'vitest';
import { HttpFailure } from './merge-gate-fake-github.ts';
import { boothPull, mergeableBooth, runGate, SHA } from './merge-gate-world.ts';

const GUIDE = 'https://github.com/elves/carnival/blob/main/docs/how-it-works.md';

describe('a booth pull request that passes every step', () => {
  it('posts the checklist, merges, closes the request and publishes the map', async () => {
    const run = await runGate(mergeableBooth());
    const writes = run.writes();
    expect(writes[0]?.path).toBe('issues/7/comments');
    expect(writes.slice(1)).toEqual([
      { method: 'POST', path: 'issues/7/labels', body: { labels: ['auto-merged'] } },
      { method: 'PUT', path: 'pulls/7/merge', body: { merge_method: 'merge', sha: SHA } },
      {
        method: 'POST',
        path: 'issues/5/comments',
        body: {
          body: `Your booth is on the map. It merged on its own in #7 after passing every check in the auto-merge gate. [How your request is built](${GUIDE}) explains each one.`,
        },
      },
      { method: 'PATCH', path: 'issues/5', body: { state: 'closed', state_reason: 'completed' } },
      { method: 'POST', path: 'actions/workflows/pages.yml/dispatches', body: { ref: 'main' } },
    ]);
    expect(run.logs).toEqual([
      `#7 (booth holly, ${SHA.slice(0, 7)}): merge`,
      '#7: merged',
      'published the map',
    ]);
    expect(run.exitCode).toBeUndefined();
  });

  it('writes a checklist that says each step passed and links the guide', async () => {
    const run = await runGate(mergeableBooth());
    const body = (run.writes()[0]?.body as { body: string } | undefined)?.body ?? '';
    expect(body.startsWith('<!-- booth-gate -->\n### How this booth gets onto the map')).toBe(true);
    expect(body).toContain('**Request accepted** (Passed)');
    expect(body).not.toContain('One at a time');
    expect(body).not.toContain('(Waiting)');
    expect(body).toContain(`[How your request is built](${GUIDE})`);
  });

  it('edits its own checklist in place, and leaves it alone when nothing changed', async () => {
    const first = await runGate(mergeableBooth());
    const posted = (first.writes()[0]?.body as { body: string }).body;
    const routes = mergeableBooth();
    const mine = (body: string) => ({ id: 99, body, user: { login: 'github-actions[bot]' } });
    const comments = routes['GET issues/7/comments'] as object[];

    routes['GET issues/7/comments'] = [...comments, mine('<!-- booth-gate -->\nold')];
    const edited = await runGate(routes);
    expect(edited.writes()[0]).toEqual({
      method: 'PATCH',
      path: 'issues/comments/99',
      body: { body: posted },
    });

    routes['GET issues/7/comments'] = [...comments, mine(posted)];
    const same = await runGate(routes);
    expect(same.writes().map((w) => w.path)).not.toContain('issues/comments/99');
    expect(same.writes()[0]?.path).toBe('issues/7/labels');
  });

  it('ignores a booth-gate comment someone else wrote', async () => {
    const routes = mergeableBooth();
    routes['GET issues/7/comments'] = [
      { id: 98, body: '<!-- booth-gate -->\nfake', user: { login: 'holly' } },
    ];
    const run = await runGate(routes);
    expect(run.writes()[0]?.path).toBe('issues/7/comments');
  });

  it('only says what it would do on a dry run', async () => {
    const run = await runGate(mergeableBooth(), { dryRun: true });
    expect(run.writes()).toEqual([]);
    expect(run.logs).toEqual([
      `#7 (booth holly, ${SHA.slice(0, 7)}): merge`,
      '#7: would post the checklist',
    ]);
  });

  it('says it would update the checklist on a dry run when one is there', async () => {
    const routes = mergeableBooth();
    routes['GET issues/7/comments'] = [
      { id: 99, body: '<!-- booth-gate -->\nold', user: { login: 'github-actions[bot]' } },
    ];
    const run = await runGate(routes, { dryRun: true });
    expect(run.logs).toContain('#7: would update the checklist');
  });
});

describe('when the merge fails', () => {
  it('takes auto-merged off again when the pull request did not merge', async () => {
    const routes = mergeableBooth();
    routes['PUT pulls/7/merge'] = new HttpFailure(409);
    routes['GET pulls/7'] = boothPull();
    const run = await runGate(routes);
    const paths = run.writes().map((w) => `${w.method} ${w.path}`);
    expect(paths).toContain('DELETE issues/7/labels/auto-merged');
    expect(paths).not.toContain('PATCH issues/5');
    expect(run.errors).toEqual(['#7: Error: PUT pulls/7/merge answered HTTP 409']);
    expect(run.exitCode).toBe(1);
  });

  it('keeps the label, and the request open, when the merge happened but its reply was lost', async () => {
    const routes = mergeableBooth();
    routes['PUT pulls/7/merge'] = new HttpFailure(502);
    routes['GET pulls/7'] = boothPull({ merged_at: '2026-12-01T12:00:00Z' });
    const run = await runGate(routes);
    const paths = run.writes().map((w) => `${w.method} ${w.path}`);
    expect(paths).not.toContain('DELETE issues/7/labels/auto-merged');
    expect(paths).not.toContain('PATCH issues/5');
    expect(paths).toContain('POST actions/workflows/pages.yml/dispatches');
    expect(run.logs).toContain('#7: merged (its reply was lost)');
    expect(run.exitCode).toBeUndefined();
  });

  it('leaves the label alone when it cannot tell whether the pull request merged', async () => {
    const routes = mergeableBooth();
    routes['PUT pulls/7/merge'] = new HttpFailure(500);
    routes['GET pulls/7'] = new HttpFailure(500);
    const run = await runGate(routes);
    expect(run.writes().map((w) => w.method)).not.toContain('DELETE');
    expect(run.exitCode).toBe(1);
  });

  it('still exits cleanly when taking the label off fails too', async () => {
    const routes = mergeableBooth();
    routes['PUT pulls/7/merge'] = new HttpFailure(409);
    routes['GET pulls/7'] = boothPull();
    routes['DELETE issues/7/labels/auto-merged'] = new HttpFailure(500);
    const run = await runGate(routes);
    expect(run.errors).toEqual(['#7: Error: PUT pulls/7/merge answered HTTP 409']);
  });
});
