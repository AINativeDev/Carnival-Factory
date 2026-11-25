/**
 * What the merge gate does on GitHub once it has decided: keep its checklist
 * comment, hold a pull request for a person, merge a booth, and close the
 * request it built. The dry run stops before any of it writes.
 */
import { get, type Comment, type GitHub, type Issue, type Pull } from './merge-gate-github.ts';

/** Posts the checklist on pull request `number`, or edits the gate's own one when it changed. */
export async function upsertChecklist(
  github: GitHub,
  number: number,
  existing: Comment[],
  body: string,
  dryRun: boolean,
) {
  const mine = existing.find(
    (c) => c.user.login === 'github-actions[bot]' && c.body.startsWith('<!-- booth-gate -->'),
  );
  if (mine?.body === body) return;
  if (dryRun) {
    console.log(`#${String(number)}: would ${mine ? 'update' : 'post'} the checklist`);
    return;
  }
  if (mine) await github.call('PATCH', `issues/comments/${String(mine.id)}`, { body });
  else await github.call('POST', `issues/${String(number)}/comments`, { body });
}

/** Puts `needs-human` on pull request `number`. */
export async function holdForPerson(github: GitHub, number: number) {
  await github.call('POST', `issues/${String(number)}/labels`, { labels: ['needs-human'] });
}

/**
 * Merges `pull` at `sha`. Returns whether it is merged and its request should
 * be closed; false when the merge happened but its reply was lost. Throws when
 * it didn't merge.
 */
export async function mergePull(github: GitHub, pull: Pull, sha: string): Promise<boolean> {
  const number = String(pull.number);
  // Label first, so the merge counts for the rate limit and the digest even if
  // a later step fails; take the label off again if the merge doesn't happen.
  await github.call('POST', `issues/${number}/labels`, { labels: ['auto-merged'] });
  try {
    // The sha pins the merge to the commit every check ran on: a push since then fails it.
    await github.call('PUT', `pulls/${number}/merge`, { merge_method: 'merge', sha });
  } catch (error) {
    // The merge may have happened even if its reply was lost: only take the
    // label off when the pull request really isn't merged.
    const after = await get<Pull>(github, `pulls/${number}`).catch(() => undefined);
    if (after?.merged_at) {
      console.log(`#${number}: merged (its reply was lost)`);
      return false;
    }
    if (after) await github.call('DELETE', `issues/${number}/labels/auto-merged`).catch(() => {});
    throw error;
  }
  console.log(`#${number}: merged`);
  return true;
}

/**
 * A merge by the workflow's token doesn't close the linked issue, so close the
 * request here, with a note on how it got onto the map.
 */
export async function closeRequest(github: GitHub, issue: Issue, pull: Pull, guide: string) {
  await github.call('POST', `issues/${String(issue.number)}/comments`, {
    body: `Your booth is on the map. It merged on its own in #${String(pull.number)} after passing every check in the auto-merge gate. [How your request is built](${guide}) explains each one.`,
  });
  await github.call('PATCH', `issues/${String(issue.number)}`, {
    state: 'closed',
    state_reason: 'completed',
  });
}
