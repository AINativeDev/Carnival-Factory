import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GIFTS } from '../carnival/attractions/gift-shop/attraction';

const plugin = join(import.meta.dirname, '../plugins/north-pole-gifts');
const skills: string[] = JSON.parse(
  readFileSync(join(plugin, '.tessl-plugin/plugin.json'), 'utf8'),
).skills.map((path: string) => path.replace('skills/', ''));

// The Gift shop's shelves and the plugin it sells from stay in step.
describe('the gift shelf', () => {
  it('shows every gift skill in the plugin, and no other', () => {
    expect(GIFTS.map((g) => g.skill).sort()).toEqual([...skills].sort());
  });

  it('documents each gift with its one install command and a worked example', () => {
    for (const skill of skills) {
      const readme = readFileSync(join(plugin, 'skills', skill, 'README.md'), 'utf8');
      expect(readme, skill).toContain(
        `tessl install github:AINativeDev/Northpole-Carnival-Factory --skill ${skill}`,
      );
      expect(readme, skill).toContain(`north-pole-gifts#${skill}`);
      expect(readFileSync(join(plugin, 'skills', skill, 'example.md'), 'utf8')).toMatch(
        /^# Worked example/,
      );
    }
  });

  it("has an eval for each of tidy-elf's outcomes", () => {
    for (const outcome of ['broken', 'couldnt-check', 'setup-failed']) {
      const scenario = join(plugin, 'evals', `tidy-elf-${outcome}`);
      expect(existsSync(join(scenario, 'task.md')), outcome).toBe(true);
      const criteria = JSON.parse(readFileSync(join(scenario, 'criteria.json'), 'utf8'));
      expect(criteria.type, outcome).toBe('weighted_checklist');
      expect(criteria.checklist.length, outcome).toBeGreaterThan(0);
    }
  });
});
