import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Which builder a labelled request reaches, read from tessl.json's own
 * triggers: a booth request goes to implement-booth and a level request to
 * implement-level, whether the assessment or a maintainer adds `tessl`
 * (issue #119), and anything else to the general implement action.
 */
interface Trigger {
  on: string[];
  when: Record<string, unknown>;
  action: string | { use: string };
}
const config = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'tessl.json'), 'utf8')) as {
  triggers: Record<string, Trigger>;
};
const MAINTAINER = 70908;
const TESSL_APP = '{{ github.tesslApp.userId }}';

/** Whether one condition holds for a value, or, for `any` and `none`, a list of them. */
function holds(condition: unknown, value: unknown): boolean {
  if (typeof condition !== 'object' || condition === null) return condition === value;
  const rule = condition as Record<string, unknown>;
  const values = Array.isArray(value) ? (value as unknown[]) : [value];
  if ('any' in rule) return values.some((one) => holds(rule.any, one));
  if ('none' in rule) return !values.some((one) => holds(rule.none, one));
  if ('in' in rule) return (rule.in as unknown[]).includes(value);
  if ('equals' in rule) return rule.equals === value;
  throw new Error(`a condition this test can't read: ${JSON.stringify(rule)}`);
}

/** The actions an `issues.labeled` event for `tessl`, by `sender`, on an issue with `labels`, starts. */
function routed(sender: number | string, labels: string[]): string[] {
  const event: Record<string, unknown> = {
    'event.label.name': 'tessl',
    'event.sender.id': sender,
    'event.issue.labels.*.name': labels,
  };
  return Object.values(config.triggers)
    .filter(
      (trigger) =>
        trigger.on.includes('github:issues.labeled') &&
        Object.entries(trigger.when).every(([path, condition]) => holds(condition, event[path])),
    )
    .map((trigger) => (typeof trigger.action === 'string' ? trigger.action : trigger.action.use));
}

describe('tessl.json routing', () => {
  it.each<[string, number | string, string[], string]>([
    ['an accepted booth request', TESSL_APP, ['booth-request', 'tessl'], 'implement-booth'],
    ["a maintainer's booth request", MAINTAINER, ['booth-request', 'tessl'], 'implement-booth'],
    ['an accepted level request', TESSL_APP, ['level-request', 'tessl'], 'implement-level'],
    ["a maintainer's level request", MAINTAINER, ['level-request', 'tessl'], 'implement-level'],
    ["a maintainer's other issue", MAINTAINER, ['tessl'], 'implement'],
  ])('sends %s to one builder', (_, sender, labels, action) => {
    expect(routed(sender, labels)).toEqual([action]);
  });

  it('builds the level with Sonnet on the dev machines, in its own folder only', () => {
    const level = (
      JSON.parse(readFileSync(join(import.meta.dirname, '..', 'tessl.json'), 'utf8')) as {
        actions: Record<
          string,
          { model: string; snapshotFamily?: string; instructions: string } | undefined
        >;
      }
    ).actions['implement-level'];
    expect(level?.model).toMatch(/sonnet/);
    expect(level?.snapshotFamily).toBe('dev');
    expect(level?.instructions).toContain('carnival/levels/<the issue author');
    expect(level?.instructions).toContain('never run npm run smoke');
  });
});
