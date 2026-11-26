/**
 * The checklist comment the merge gate keeps on a pull request: what each
 * check does, where it stands, and what happens next, so participants can
 * follow how their booth or level is built.
 */
import type { GateDecision, RequestKind } from './booth-gate.ts';
import { safeInline } from './safe-text.ts';

const STATE = { pass: 'Passed', wait: 'Waiting', fail: 'Not passed' } as const;

/** The checklist for `result`, on a pull request that builds a `kind`. */
export function gateComment(result: GateDecision, kind: RequestKind, guideUrl: string): string {
  const next = {
    merge:
      'Every check passed, so this merges on its own and appears on the map within a few minutes.',
    wait: 'Some checks are still running. This updates as they finish.',
    human: 'A check didn’t pass, so a maintainer will take a look. Nothing merges without them.',
  }[result.decision];
  return [
    // The marker stays `booth-gate` for levels too, so the gate finds its own comment either way.
    '<!-- booth-gate -->',
    `### How this ${kind} gets onto the map`,
    '',
    ...result.steps.map(
      (s) =>
        `- **${s.name}** (${STATE[s.state]}): ${s.about}${s.detail ? `  \n  ${safeInline(s.detail, 300)}` : ''}`,
    ),
    '',
    next,
    '',
    `Each step is a loop in a [Tessl](https://tessl.io) software factory. [How your request is built](${guideUrl}) explains them, and how to run one on your own repository.`,
  ].join('\n');
}
