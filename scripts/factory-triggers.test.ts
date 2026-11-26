import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface Trigger {
  on: string[];
  when: Record<string, unknown>;
  action: { use: string };
}

const root = join(import.meta.dirname, '..');
const triggers = (
  JSON.parse(readFileSync(join(root, 'tessl.json'), 'utf8')) as {
    triggers: Record<string, Trigger>;
  }
).triggers;
const previewBuild = readFileSync(join(root, '.github/workflows/preview-build.yml'), 'utf8');

// The risk check judges a booth from the smoke test's screenshot, so it starts
// when that test passes. Started on every finished group of checks, it ran
// before the screenshot existed, gave up and stopped a simple booth for a
// person, and each group started another shepherd run too.
describe('the factory starts its checks-passed work once, when the smoke test passes', () => {
  for (const action of ['assess-booth-risk', 'shepherd']) {
    it(`starts ${action} on the smoke job's check run passing, never on a check suite`, () => {
      const passed = Object.values(triggers).filter(
        (t) => t.action.use === action && JSON.stringify(t.when).includes('success'),
      );
      expect(passed).toHaveLength(1);
      expect(passed[0]?.on).toEqual(['github:check_run.completed']);
      expect(passed[0]?.when['event.check_run.name']).toBe('smoke');
      expect(passed[0]?.when['event.check_run.conclusion']).toBe('success');
    });
  }

  it('names a job the Preview build really has', () => {
    expect(previewBuild).toMatch(/^ {2}smoke:$/m);
  });
});
