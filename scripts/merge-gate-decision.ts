/**
 * What the merge gate decides beyond `evaluateGate` in scripts/booth-gate.ts:
 * whether it puts `needs-human` on a pull request itself.
 */
import type { GateDecision } from './booth-gate.ts';

/** Gate steps whose failure is labelled by someone else: the risk check, or a maintainer. */
const LABELLED_ELSEWHERE = new Set(['Risk and taste check', 'No one has asked to hold it']);

/**
 * Whether the gate labels the pull request `needs-human`: only for its own
 * deterministic failures. The risk check labels its own verdicts, and a
 * maintainer removing the label is asking it to look again, so the gate
 * mustn't put the label straight back over that.
 */
export function holdsForPerson(result: GateDecision, labels: readonly string[]): boolean {
  const ownFailures = result.steps.filter(
    (step) => step.hard && step.state === 'fail' && !LABELLED_ELSEWHERE.has(step.name),
  );
  return ownFailures.length > 0 && !labels.includes('needs-human');
}
